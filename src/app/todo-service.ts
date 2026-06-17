import { Injectable, signal, computed } from '@angular/core';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  // Authentication State Signals
  currentUser = signal<User | null>(null);
  authLoading = signal<boolean>(true);
  authError = signal<string | null>(null);
  
  // Todo Items State Signals
  todos = signal<Task[]>([]);
  todosLoading = signal<boolean>(false);
  
  // Filters and Searching Signals
  searchQuery = signal<string>('');
  categoryFilter = signal<string>('All');
  priorityFilter = signal<string>('All');
  statusFilter = signal<string>('All'); // 'All' | 'Pending' | 'Completed'
  sortBy = signal<'dueDate' | 'priority' | 'createdAt'>('createdAt');

  private unsubscribeTodos: (() => void) | null = null;

  constructor() {
    // Monitor Auth State Changes
    if (auth) {
      onAuthStateChanged(auth, (user) => {
        this.currentUser.set(user);
        this.authLoading.set(false);
        this.authError.set(null);
        
        if (user) {
          this.subscribeToTodos(user.uid);
        } else {
          this.clearTodosSubscription();
        }
      }, (error) => {
        this.authError.set(error.message);
        this.authLoading.set(false);
      });
    } else {
      this.authLoading.set(false);
    }
  }

  // real-time Firestore synchronization subscription
  private subscribeToTodos(userId: string) {
    if (!db) return;
    this.todosLoading.set(true);
    this.clearTodosSubscription();

    const todosCol = collection(db, 'todos');
    const q = query(todosCol, where('userId', '==', userId));

    this.unsubscribeTodos = onSnapshot(q, (snapshot) => {
      const items: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data['userId'] || '',
          title: data['title'] || '',
          description: data['description'] || '',
          category: data['category'] || 'General',
          priority: data['priority'] || 'medium',
          dueDate: data['dueDate'] || null,
          completed: !!data['completed'],
          createdAt: data['createdAt'] || new Date().toISOString(),
          completedAt: data['completedAt'] || null,
        });
      });
      this.todos.set(items);
      this.todosLoading.set(false);
    }, (error) => {
      console.error('Firestore snapshot subscription error:', error);
      this.todosLoading.set(false);
    });
  }

  private clearTodosSubscription() {
    if (this.unsubscribeTodos) {
      this.unsubscribeTodos();
      this.unsubscribeTodos = null;
    }
    this.todos.set([]);
  }

  // --- Filter and Sort Core Computations (Using Signals) ---
  filteredAndSortedTodos = computed(() => {
    let list = this.todos();

    // 1. Filter by Completion Status
    const status = this.statusFilter();
    if (status === 'Pending') {
      list = list.filter(t => !t.completed);
    } else if (status === 'Completed') {
      list = list.filter(t => t.completed);
    }

    // 2. Filter by Category
    const category = this.categoryFilter();
    if (category !== 'All') {
      list = list.filter(t => t.category === category);
    }

    // 3. Filter by Priority
    const priority = this.priorityFilter();
    if (priority !== 'All') {
      list = list.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
    }

    // 4. Search Filter
    const queryStr = this.searchQuery().trim().toLowerCase();
    if (queryStr) {
      list = list.filter(t => 
        t.title.toLowerCase().includes(queryStr) || 
        t.description.toLowerCase().includes(queryStr)
      );
    }

    // 5. Sort
    const sortField = this.sortBy();
    list = [...list].sort((a, b) => {
      if (sortField === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      } else if (sortField === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      } else {
        // Default: createdAt descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  });

  // Unique category list computed signal
  availableCategories = computed(() => {
    const defaultCats = ['Personal', 'Work', 'Shopping', 'Health', 'General'];
    const customCats = this.todos().map(t => t.category);
    const set = new Set([...defaultCats, ...customCats]);
    return Array.from(set).filter(Boolean);
  });

  // Stats Counters
  stats = computed(() => {
    const list = this.todos();
    const total = list.length;
    const completed = list.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const priorities = { high: 0, medium: 0, low: 0 };
    list.forEach(t => {
      if (!t.completed && t.priority in priorities) {
        priorities[t.priority]++;
      }
    });

    return { total, completed, pending, rate, priorities };
  });

  // --- Core CRUD Actions ---
  async addTask(task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'completedAt'>) {
    const user = this.currentUser();
    if (!user || !db) return;

    try {
      const todoData = {
        ...task,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      await addDoc(collection(db, 'todos'), todoData);
    } catch (e) {
      console.error('Error adding document into Firestore:', e);
      throw e;
    }
  }

  async updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) {
    if (!db) return;
    try {
      if (updates.completed !== undefined) {
        updates.completedAt = updates.completed ? new Date().toISOString() : null;
      }
      const taskDocRef = doc(db, 'todos', taskId);
      await updateDoc(taskDocRef, updates);
    } catch (e) {
      console.error('Error updating document in Firestore:', e);
      throw e;
    }
  }

  async deleteTask(taskId: string) {
    if (!db) return;
    try {
      const taskDocRef = doc(db, 'todos', taskId);
      await deleteDoc(taskDocRef);
    } catch (e) {
      console.error('Error deleting document from Firestore:', e);
      throw e;
    }
  }

  // --- Auth Functionality ---
  async signUp(email: string, password: string) {
    if (!auth) return;
    this.authLoading.set(true);
    this.authError.set(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const e = error as { message?: string; code?: string };
      this.authError.set(e.message || 'An error occurred during account registration.');
      this.authLoading.set(false);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    if (!auth) return;
    this.authLoading.set(true);
    this.authError.set(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const e = error as { message?: string; code?: string };
      this.authError.set(e.message || 'An error occurred during account authentication.');
      this.authLoading.set(false);
      throw error;
    }
  }

  async logout() {
    if (!auth) return;
    this.authLoading.set(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      this.authLoading.set(false);
    }
  }
}
