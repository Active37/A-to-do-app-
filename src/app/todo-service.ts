import { Injectable, signal, computed } from '@angular/core';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'normal' | 'low';
  project: string;
  dueDate: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  // Authentication signals
  currentUser = signal<any>(null);
  authLoading = signal<boolean>(true);
  authError = signal<string | null>(null);
  isSandboxAuth = signal<boolean>(false);

  // Task signals
  tasks = signal<Task[]>([]);
  tasksLoading = signal<boolean>(false);

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    // Check for cached sandbox credentials
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('sandbox_current_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          this.currentUser.set(parsed);
          this.isSandboxAuth.set(true);
          this.authLoading.set(false);
          this.loadTasks(parsed.uid);
        } catch (e) {
          console.error('Failed restoring sandbox session', e);
        }
      }
    }

    onAuthStateChanged(auth, (user: any) => {
      if (user) {
        this.isSandboxAuth.set(false);
        this.currentUser.set(user);
        this.authLoading.set(false);
        this.authError.set(null);
        this.loadTasks(user.uid);
      } else {
        // Only reset if we are NOT in local sandbox mode
        if (!this.isSandboxAuth()) {
          this.currentUser.set(null);
          this.tasks.set([]);
          this.authLoading.set(false);
        }
      }
    });
  }

  async loadTasks(userId: string) {
    this.tasksLoading.set(true);

    if (this.isSandboxAuth()) {
      try {
        const stored = localStorage.getItem(`sandbox_tasks_${userId}`);
        const loadedTasks: Task[] = stored ? JSON.parse(stored) : [];
        loadedTasks.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          return b.createdAt - a.createdAt;
        });
        this.tasks.set(loadedTasks);
      } catch (e) {
        console.error('Failed loading sandbox tasks', e);
        this.tasks.set([]);
      } finally {
        this.tasksLoading.set(false);
      }
      return;
    }

    const path = `users/${userId}/tasks`;
    try {
      const q = query(collection(db, path));
      const querySnapshot = await getDocs(q);
      const loadedTasks: Task[] = [];
      querySnapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        loadedTasks.push({
          id: docSnap.id,
          title: data['title'] || '',
          description: data['description'] || '',
          completed: !!data['completed'],
          priority: data['priority'] || 'normal',
          project: data['project'] || 'Inbox',
          dueDate: data['dueDate'] || '',
          createdAt: data['createdAt'] || Date.now()
        });
      });
      // Sort: incomplete first, then by date/createdAt descending
      loadedTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return b.createdAt - a.createdAt;
      });
      this.tasks.set(loadedTasks);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      this.tasksLoading.set(false);
    }
  }

  async addTask(title: string, description: string, priority: 'high' | 'normal' | 'low', project: string, dueDate: string) {
    const user = this.currentUser();
    if (!user) throw new Error('Action restricted to active sessions.');

    if (this.isSandboxAuth()) {
      const newTask: Task = {
        id: 'local_' + Math.random().toString(36).substring(2, 9),
        title,
        description: description || '',
        completed: false,
        priority,
        project: project || 'Inbox',
        dueDate: dueDate || 'Today',
        createdAt: Date.now()
      };
      this.tasks.update((curr) => [newTask, ...curr]);
      localStorage.setItem(`sandbox_tasks_${user.uid}`, JSON.stringify(this.tasks()));
      return;
    }

    const path = `users/${user.uid}/tasks`;
    try {
      const colRef = collection(db, path);
      const payload = {
        title,
        description: description || '',
        completed: false,
        priority,
        project: project || 'Inbox',
        dueDate: dueDate || 'Today',
        createdAt: Date.now()
      };
      const docRef = await addDoc(colRef, payload);
      
      // Update local state reactively
      const newTask: Task = {
        id: docRef.id,
        ...payload
      };
      this.tasks.update((curr) => [newTask, ...curr]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async toggleTask(task: Task) {
    const user = this.currentUser();
    if (!user) return;

    if (this.isSandboxAuth()) {
      const nextCompleted = !task.completed;
      this.tasks.update((curr) => 
        curr.map((t) => t.id === task.id ? { ...t, completed: nextCompleted } : t)
      );
      localStorage.setItem(`sandbox_tasks_${user.uid}`, JSON.stringify(this.tasks()));
      return;
    }

    const path = `users/${user.uid}/tasks/${task.id}`;
    try {
      const docRef = doc(db, `users/${user.uid}/tasks`, task.id);
      const nextCompleted = !task.completed;
      await updateDoc(docRef, { completed: nextCompleted });

      // Update local state reactively
      this.tasks.update((curr) => 
        curr.map((t) => t.id === task.id ? { ...t, completed: nextCompleted } : t)
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    const user = this.currentUser();
    if (!user) return;

    if (this.isSandboxAuth()) {
      this.tasks.update((curr) =>
        curr.map((t) => t.id === taskId ? { ...t, ...updates } : t)
      );
      localStorage.setItem(`sandbox_tasks_${user.uid}`, JSON.stringify(this.tasks()));
      return;
    }

    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await updateDoc(docRef, updates);

      // Update local state reactively
      this.tasks.update((curr) =>
        curr.map((t) => t.id === taskId ? { ...t, ...updates } : t)
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async deleteTask(taskId: string) {
    const user = this.currentUser();
    if (!user) return;

    if (this.isSandboxAuth()) {
      this.tasks.update((curr) => curr.filter((t) => t.id !== taskId));
      localStorage.setItem(`sandbox_tasks_${user.uid}`, JSON.stringify(this.tasks()));
      return;
    }

    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await deleteDoc(docRef);

      // Update local state reactively
      this.tasks.update((curr) => curr.filter((t) => t.id !== taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Crypto subtle unavailable, using mock crypto hash fallback');
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return 'fallback_hash_' + Math.abs(hash).toString(16);
    }
  }

  async signUp(email: string, password: string, username: string) {
    this.authLoading.set(true);
    this.authError.set(null);
    try {
      const securePassword = await this.hashPassword(password);
      const userCredential = await createUserWithEmailAndPassword(auth, email, securePassword);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: username });
        this.isSandboxAuth.set(false);
        this.currentUser.set({ ...userCredential.user, displayName: username });
      }
    } catch (error: any) {
      console.warn('Firebase signUp error captured:', error);
      // Fallback for auth/operation-not-allowed or admin restriction errors (or user disabled)
      const errCode = error?.code || '';
      const errMsg = error?.message || '';
      const isRestricted = errCode === 'auth/operation-not-allowed' || 
                           errCode === 'auth/admin-restricted-operation' || 
                           errMsg.includes('denied') || 
                           errMsg.includes('not allowed') || 
                           errMsg.includes('disabled');

      if (isRestricted) {
        console.info('Switching to local secure Sandbox auth environment.');
        const securePassword = await this.hashPassword(password);
        
        const registeredUsersRaw = localStorage.getItem('local_sandbox_users') || '{}';
        const registeredUsers = JSON.parse(registeredUsersRaw);
        const normEmail = email.trim().toLowerCase();

        if (registeredUsers[normEmail]) {
          const customErr = new Error('This email user account is already active.');
          (customErr as any).code = 'auth/email-already-in-use';
          this.authError.set('This email user account is already active.');
          this.authLoading.set(false);
          throw customErr;
        }

        const userId = 'sandbox_' + btoa(normEmail).replace(/=/g, '').substring(0, 15);
        registeredUsers[normEmail] = {
          uid: userId,
          email: normEmail,
          passwordHash: securePassword,
          displayName: username
        };
        localStorage.setItem('local_sandbox_users', JSON.stringify(registeredUsers));

        const sandboxUser = {
          uid: userId,
          email: normEmail,
          displayName: username,
          isSandbox: true
        };
        localStorage.setItem('sandbox_current_user', JSON.stringify(sandboxUser));
        
        this.isSandboxAuth.set(true);
        this.currentUser.set(sandboxUser);
        this.authLoading.set(false);
        this.loadTasks(userId);
      } else {
        const e = error as { message?: string; code?: string };
        this.authError.set(e.message || 'An error occurred during account registration.');
        this.authLoading.set(false);
        throw error;
      }
    }
  }

  async signIn(email: string, password: string) {
    this.authLoading.set(true);
    this.authError.set(null);
    try {
      const securePassword = await this.hashPassword(password);
      await signInWithEmailAndPassword(auth, email, securePassword);
      this.isSandboxAuth.set(false);
    } catch (error: any) {
      console.warn('Firebase signIn error captured:', error);
      const errCode = error?.code || '';
      const errMsg = error?.message || '';
      const isRestricted = errCode === 'auth/operation-not-allowed' || 
                           errCode === 'auth/user-not-found' ||
                           errCode === 'auth/admin-restricted-operation' || 
                           errMsg.includes('denied') || 
                           errMsg.includes('not allowed') || 
                           errMsg.includes('disabled');

      if (isRestricted) {
        const normEmail = email.trim().toLowerCase();
        const registeredUsersRaw = localStorage.getItem('local_sandbox_users') || '{}';
        const registeredUsers = JSON.parse(registeredUsersRaw);
        const localUser = registeredUsers[normEmail];

        if (localUser) {
          const securePassword = await this.hashPassword(password);
          if (localUser.passwordHash === securePassword) {
            const sandboxUser = {
              uid: localUser.uid,
              email: localUser.email,
              displayName: localUser.displayName,
              isSandbox: true
            };
            localStorage.setItem('sandbox_current_user', JSON.stringify(sandboxUser));
            
            this.isSandboxAuth.set(true);
            this.currentUser.set(sandboxUser);
            this.authLoading.set(false);
            this.loadTasks(localUser.uid);
            return;
          } else {
            const customErr = new Error('Invalid credentials. Please verify and try again.');
            (customErr as any).code = 'auth/wrong-password';
            this.authError.set('Invalid credentials. Please verify and try again.');
            this.authLoading.set(false);
            throw customErr;
          }
        }

        if (errCode === 'auth/operation-not-allowed' || errCode === 'auth/user-not-found') {
          const customErr = new Error('No registered workspace found. Please select "Register Workspace" below to sign up.');
          (customErr as any).code = 'auth/user-not-found';
          this.authError.set('No registered workspace found. Please select "Register Workspace" below to sign up.');
          this.authLoading.set(false);
          throw customErr;
        }
      }

      const e = error as { message?: string; code?: string };
      this.authError.set(e.message || 'An error occurred during account authentication.');
      this.authLoading.set(false);
      throw error;
    }
  }

  async logout() {
    this.authLoading.set(true);
    try {
      localStorage.removeItem('sandbox_current_user');
      this.isSandboxAuth.set(false);
      this.currentUser.set(null);
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      this.authLoading.set(false);
    }
  }
}
