import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TodoService, Task } from './todo-service';

@Component({
  selector: 'app-todo-dashboard',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden">
      
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0">
        <div class="flex flex-col flex-1 overflow-y-auto">
          <!-- Logo & Brand Header -->
          <div class="p-6 flex items-center gap-3 border-b border-slate-800">
            <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span class="material-icons text-white text-lg">task_alt</span>
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-white text-base tracking-tight leading-none">TaskFlow Pro</span>
              <span class="text-[9px] text-slate-400 tracking-wider font-semibold uppercase mt-0.5">Secure Cloud Space</span>
            </div>
          </div>
          
          <!-- Navigation -->
          <nav class="flex-1 py-6 px-4 space-y-5">
            <div class="space-y-1">
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 px-2">System Views</div>
              <button 
                (click)="setFilter('all')"
                [class]="currentFilter() === 'all' ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/50 hover:text-white'"
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm group">
                <span class="flex items-center gap-3">
                  <span class="material-icons text-lg group-hover:scale-105 transition-transform text-indigo-400">format_list_bulleted</span>
                  All Tasks
                </span>
                <span class="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{{ totalCount() }}</span>
              </button>
              
              <button 
                (click)="setFilter('today')"
                [class]="currentFilter() === 'today' ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/50 hover:text-white'"
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm group">
                <span class="flex items-center gap-3">
                  <span class="material-icons text-lg group-hover:scale-105 transition-transform text-emerald-400">today</span>
                  Today
                </span>
                <span class="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{{ todayCount() }}</span>
              </button>
              
              <button 
                (click)="setFilter('completed')"
                [class]="currentFilter() === 'completed' ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/50 hover:text-white'"
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm group">
                <span class="flex items-center gap-3">
                  <span class="material-icons text-lg group-hover:scale-105 transition-transform text-amber-400">check_box</span>
                  Completed
                </span>
              </button>
            </div>

            <!-- Categories / Personal Projects -->
            <div class="space-y-1">
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 px-2">Projects</div>
              <button 
                (click)="setProjectFilter('Inbox')"
                [class]="currentProjectFilter() === 'Inbox' ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/50 hover:text-white'"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                  Inbox
                </span>
                <span class="text-[10px] text-slate-500">{{ inboxCount() }}</span>
              </button>
              
              <button 
                (click)="setProjectFilter('Engineering')"
                [class]="currentProjectFilter() === 'Engineering' ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/50 hover:text-white'"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                  Engineering
                </span>
                <span class="text-[10px] text-slate-500">{{ engineeringCount() }}</span>
              </button>

              <button 
                (click)="setProjectFilter('Marketing')"
                [class]="currentProjectFilter() === 'Marketing' ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/50 hover:text-white'"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Marketing
                </span>
                <span class="text-[10px] text-slate-500">{{ marketingCount() }}</span>
              </button>
            </div>
          </nav>
        </div>

        <!-- PWA / Offline Sync Promo Area -->
        <div class="p-4 border-t border-slate-800/60 shrink-0">
          <!-- Install Button Banner -->
          @if (showInstallBanner()) {
            <div class="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 mb-3">
              <p class="text-xs text-indigo-200 font-semibold mb-1 flex items-center gap-1.5">
                <span class="material-icons text-sm">cloud_download</span>
                Sync to Mobile
              </p>
              <p class="text-[10px] text-slate-400 mb-3 leading-normal">
                Take your secure workspace tasks anywhere offline. Install our launcher setup.
              </p>
              <button 
                (click)="installPwa()"
                class="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-[11px] font-bold py-2 rounded-lg transition-all shadow-sm">
                Install Applet
              </button>
            </div>
          }

          <!-- User Profiling actions -->
          <div class="flex items-center justify-between bg-slate-800/30 p-2.5 rounded-xl border border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                {{ userInitials() }}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold text-white truncate leading-none">{{ emailPrefix() }}</span>
                <span class="text-[9px] text-slate-500 font-semibold mt-0.5">Alex Henderson</span>
              </div>
            </div>
            <button 
              (click)="todoService.logout()" 
              title="Secure Terminate Session"
              class="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-all">
              <span class="material-icons text-lg">power_settings_new</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col overflow-hidden">
        
        <!-- Header -->
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div class="flex-1 max-w-md">
            <div class="relative">
              <span class="material-icons absolute left-3.5 top-2 text-slate-400 text-lg">search</span>
              <input 
                type="text" 
                [formControl]="searchControl"
                class="block w-full pl-10 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                placeholder="Search tasks instantly..."/>
            </div>
          </div>
          
          <div class="flex items-center gap-6">
            <!-- Security Session Badge -->
            <div class="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span class="material-icons text-base">verified_user</span>
              <span class="text-[10px] font-bold uppercase tracking-wider">Secure Session Active</span>
            </div>

            <!-- Profile Info panel -->
            <div class="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div class="text-right">
                <div class="text-xs font-bold text-slate-900">Alex Henderson</div>
                <div class="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Enterprise account</div>
              </div>
              <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs border border-slate-200 shadow-sm uppercase">
                AH
              </div>
            </div>
          </div>
        </header>

        <!-- Main Workspace Subgrid -->
        <div class="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto">
          
          <!-- Column 1 & 2: Main Task flow -->
          <div class="lg:col-span-2 flex flex-col space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold text-slate-900 leading-tight">Today's Active Agenda</h1>
                <p class="text-xs text-slate-500 font-medium mt-0.5">Workspace database synchronization online</p>
              </div>
              <span class="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-semibold">
                {{ filteredTasks().length }} Tasks
              </span>
            </div>

            <!-- Quick Add Form Panel -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <form [formGroup]="addTaskForm" (ngSubmit)="onAddTask()" class="space-y-3">
                <div class="flex gap-2">
                  <input 
                    type="text" 
                    formControlName="title"
                    class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs leading-normal bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                    placeholder="Describe a task key responsibility to complete..."/>
                  
                  <button 
                    type="submit" 
                    [disabled]="addTaskForm.invalid"
                    class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 disabled:cursor-not-allowed transition-all text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm shrink-0">
                    <span class="material-icons text-sm">add</span>
                    Add Task
                  </button>
                </div>

                <div class="grid grid-cols-3 gap-3 pt-1">
                  <!-- Category/Project selection -->
                  <div>
                    <label class="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Project Space</label>
                    <select 
                      formControlName="project"
                      class="block w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none">
                      <option value="Inbox">Inbox</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>

                  <!-- Priority select -->
                  <div>
                    <label class="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Priority Level</label>
                    <select 
                      formControlName="priority"
                      class="block w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none">
                      <option value="high">🔥 High Priority</option>
                      <option value="normal">⚡ Normal Priority</option>
                      <option value="low">🌱 Low Priority</option>
                    </select>
                  </div>

                  <!-- Due date select -->
                  <div>
                    <label class="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target Date</label>
                    <select 
                      formControlName="dueDate"
                      class="block w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none">
                      <option value="Today">Today</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="Next Week">Next Week</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <!-- Task Items Stack -->
            <div class="space-y-3">
              @if (todoService.tasksLoading()) {
                <div class="flex flex-col items-center justify-center p-12 text-slate-400 bg-white border border-slate-200 rounded-xl">
                  <span class="animate-spin border-3 border-indigo-600 border-t-transparent w-8 h-8 rounded-full mb-3"></span>
                  <p class="text-xs font-semibold uppercase tracking-wider">Synchronizing secure database...</p>
                </div>
              } @else if (filteredTasks().length === 0) {
                <div class="flex flex-col items-center justify-center p-12 text-slate-400 bg-white border border-slate-200 rounded-xl">
                  <span class="material-icons text-5xl text-slate-200 mb-3">task_alt</span>
                  <p class="text-xs font-bold uppercase tracking-wider">Workspace is pristine empty</p>
                  <p class="text-[11px] text-slate-400 mt-1 leading-normal text-center">Add critical path items above to register priorities</p>
                </div>
              } @else {
                @for (task of filteredTasks(); track task.id) {
                  <div 
                    [class]="task.completed ? 'opacity-65 bg-slate-50 border-slate-200' : 'bg-white hover:border-slate-350 shadow-sm border-slate-200'"
                    [class.border-l-rose-500]="task.priority === 'high'"
                    [class.border-l-indigo-500]="task.priority === 'normal'"
                    [class.border-l-slate-300]="task.priority === 'low'"
                    class="p-4 rounded-xl border border-l-4 border-slate-200 flex items-center justify-between transition-all gap-4">
                    
                    <div class="flex items-center gap-4 min-w-0">
                      <!-- Custom Styled Checkbox -->
                      <button 
                        (click)="todoService.toggleTask(task)"
                        type="button"
                        class="w-5 h-5 rounded-md border flex items-center justify-center transition-all focus:outline-none shrink-0"
                        [class]="task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 hover:border-indigo-600 bg-slate-50'">
                        @if (task.completed) {
                          <span class="material-icons text-base">check</span>
                        }
                      </button>

                      <div class="min-w-0">
                        <p 
                          [class.line-through]="task.completed"
                          [class.text-slate-400]="task.completed"
                          class="font-semibold text-xs text-slate-800 truncate leading-normal transition-all">
                          {{ task.title }}
                        </p>
                        
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-[9px] uppercase font-bold text-slate-500">{{ task.project }}</span>
                          <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span 
                            [class]="task.priority === 'high' ? 'text-rose-600 bg-rose-50 border-rose-150' : task.priority === 'normal' ? 'text-indigo-600 bg-indigo-50 border-indigo-150' : 'text-slate-600 bg-slate-100 border-slate-200'"
                            class="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border">
                            {{ task.priority }} Priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 shrink-0">
                      <div class="flex items-center gap-1.5 text-slate-400">
                        <span class="material-icons text-sm">schedule</span>
                        <span class="text-[10px] font-semibold uppercase">{{ task.dueDate }}</span>
                      </div>

                      <button 
                        (click)="todoService.deleteTask(task.id)"
                        title="Eliminate Task"
                        class="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-all">
                        <span class="material-icons text-base">delete_outline</span>
                      </button>
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Column 3: Stats, App Security & Activities -->
          <div class="space-y-6">
            
            <!-- Productivity Score Card -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 class="font-bold text-slate-900 text-sm">Task Productivity Index</h3>
              <p class="text-[11px] text-slate-500 mb-4 font-medium mt-0.5">Completed vs active registered items</p>
              
              <div class="flex items-end gap-2.5 mb-2.5">
                <span class="text-4xl font-extrabold tracking-tight text-slate-900">{{ completionPercent() }}%</span>
                @if (completionPercent() >= 75) {
                  <span class="text-emerald-600 text-xs font-bold flex items-center mb-1">
                    <span class="material-icons text-sm mr-0.5">trending_up</span> Optimized
                  </span>
                } @else {
                  <span class="text-slate-400 text-xs font-semibold mb-1">In progress</span>
                }
              </div>

              <!-- Sleek Progress Bar -->
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                <div 
                  [style.width.%]="completionPercent()"
                  class="bg-indigo-600 h-full rounded-full transition-all duration-500">
                </div>
              </div>

              <p class="text-[11px] leading-normal text-slate-400">
                You've checked off {{ completedCount() }} out of {{ totalCount() }} total tasks in this session. Reaching 100% optimizes your server productivity profile metrics.
              </p>
            </div>

            <!-- App Security Vault Banner -->
            <div class="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative border border-slate-800">
              <div class="relative z-10">
                <h3 class="font-bold text-sm">Security & Privacy Lock</h3>
                <p class="text-[10px] text-slate-400 mb-4 font-medium mt-0.5">End-to-end cloud protection active</p>

                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span class="text-[11px] text-slate-300 font-medium">Session Authenticated Token: ACTIVE</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span class="text-[11px] text-slate-300 font-medium">Database Node Firewall: ONLINE</span>
                  </div>
                </div>

                <div class="mt-6 flex gap-2">
                  <button 
                    (click)="triggerLockState()"
                    class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-white rounded text-[11px] font-bold border border-slate-700 tracking-wider transition-all uppercase">
                    Lock Terminal
                  </button>
                  <button 
                    (click)="triggerMockVault()"
                    class="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold tracking-wider transition-all uppercase">
                    Config Vault
                  </button>
                </div>
              </div>
              <!-- Decorative elements mimicking the design HTML -->
              <div class="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/15 rounded-full blur-2xl"></div>
              <div class="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-600/10 rounded-full blur-xl"></div>
            </div>

            <!-- Recent activity trails -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Security Access Journal</h3>
              <p class="text-[10px] text-slate-400 font-medium mt-0.5 mb-4">Latest socket events logged securely</p>

              <div class="space-y-4">
                <div class="flex gap-3">
                  <div class="w-1 bg-indigo-200 rounded-full shrink-0"></div>
                  <div>
                    <p class="text-xs font-semibold text-slate-800">Established secure cloud connection</p>
                    <p class="text-[10px] text-slate-400 tracking-wide mt-0.5">Just now • Firestore Engine API</p>
                  </div>
                </div>

                <div class="flex gap-3">
                  <div class="w-1 bg-emerald-200 rounded-full shrink-0"></div>
                  <div>
                    <p class="text-xs font-semibold text-slate-800">PWA Offline manifest verified</p>
                    <p class="text-[10px] text-slate-400 tracking-wide mt-0.5">2 mins ago • Standalone Browser Node</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class TodoDashboard {
  todoService = inject(TodoService);

  // Filters state
  currentFilter = signal<'all' | 'today' | 'completed'>('all');
  currentProjectFilter = signal<string | null>(null);
  searchControl = new FormControl('');

  // Form controls
  addTaskForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(2)]),
    priority: new FormControl<'high' | 'normal' | 'low'>('normal', [Validators.required]),
    project: new FormControl('Inbox', [Validators.required]),
    dueDate: new FormControl('Today', [Validators.required])
  });

  // PWA elements
  showInstallBanner = signal<boolean>(false);
  deferredPrompt = signal<{ prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  // Computations
  emailPrefix = computed(() => {
    const user = this.todoService.currentUser();
    if (!user || !user.email) return 'User Workspace';
    return user.email.split('@')[0];
  });

  userInitials = computed(() => {
    const prefix = this.emailPrefix();
    if (prefix === 'User Workspace') return 'UW';
    return prefix.substring(0, 2).toUpperCase();
  });

  // Filtered task counts
  totalCount = computed(() => this.todoService.tasks().length);
  completedCount = computed(() => this.todoService.tasks().filter(t => t.completed).length);
  
  todayCount = computed(() => 
    this.todoService.tasks().filter(t => t.dueDate === 'Today' && !t.completed).length
  );
  
  inboxCount = computed(() => 
    this.todoService.tasks().filter(t => t.project === 'Inbox' && !t.completed).length
  );
  
  engineeringCount = computed(() => 
    this.todoService.tasks().filter(t => t.project === 'Engineering' && !t.completed).length
  );
  
  marketingCount = computed(() => 
    this.todoService.tasks().filter(t => t.project === 'Marketing' && !t.completed).length
  );

  completionPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  filteredTasks = computed(() => {
    let list = this.todoService.tasks();
    const filter = this.currentFilter();
    const projFilter = this.currentProjectFilter();
    const queryStr = (this.searchControl.value || '').toLowerCase().trim();

    // Text search filter
    if (queryStr) {
      list = list.filter((t) => t.title.toLowerCase().includes(queryStr));
    }

    // Nav-bar general category filter
    if (filter === 'today') {
      list = list.filter((t) => t.dueDate === 'Today');
    } else if (filter === 'completed') {
      list = list.filter((t) => t.completed);
    }

    // Sidebar individual project selection
    if (projFilter) {
      list = list.filter((t) => t.project === projFilter);
    }

    return list;
  });

  setFilter(view: 'all' | 'today' | 'completed') {
    this.currentFilter.set(view);
    this.currentProjectFilter.set(null); // Clear specific project filters when system filters changed
  }

  setProjectFilter(proj: string) {
    this.currentProjectFilter.set(proj);
    this.currentFilter.set('all'); // Clear special system filters
  }

  onAddTask() {
    if (this.addTaskForm.invalid) return;

    const val = this.addTaskForm.value;
    const title = val.title || '';
    const priority = val.priority as 'high' | 'normal' | 'low';
    const project = val.project || 'Inbox';
    const dueDate = val.dueDate || 'Today';

    this.todoService.addTask(title, priority, project, dueDate).then(() => {
      this.addTaskForm.patchValue({ title: '' }); // reset only title
    }).catch(err => {
      alert('Error creating task in session: ' + err.message);
    });
  }

  triggerLockState() {
    this.todoService.logout();
  }

  triggerMockVault() {
    alert('Enterprise Secure Vault configuration dashboard is encrypted and strictly managed via root security rules.');
  }

  // --- Progressive Web App (PWA) Event Listener handlers ---
  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: Event) {
    // Prevent default browser prompt and save event trigger
    e.preventDefault();
    this.deferredPrompt.set(e as any);
    this.showInstallBanner.set(true);
  }

  installPwa() {
    const promptEvent = this.deferredPrompt();
    if (!promptEvent) {
      alert('PWA launcher installation is processed or directly cached by your browser settings.');
      return;
    }

    // Call browser's custom launcher prompt
    promptEvent.prompt();
    promptEvent.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User completed installation choice registration');
        this.showInstallBanner.set(false);
        this.deferredPrompt.set(null);
      }
    });
  }
}
