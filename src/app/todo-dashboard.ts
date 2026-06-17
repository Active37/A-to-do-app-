import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TodoService, Task } from './todo-service';

@Component({
  selector: 'app-todo-dashboard',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- PWA Installation Banner (Top Notification Bar) -->
      @if (showInstallBanner()) {
        <div class="bg-indigo-600 rounded-2xl text-white p-5 shadow-lg border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300">
          <div class="flex items-start gap-3.5">
            <div class="p-3 bg-white/10 rounded-xl text-white">
              <mat-icon class="text-2xl h-auto w-auto">install_mobile</mat-icon>
            </div>
            <div>
              <h3 class="font-display font-bold text-lg">Download TaskFlow to Your Phone</h3>
              <p class="text-indigo-100 text-sm mt-0.5 max-w-2xl">
                Install as an app for fast, fluid offline task tracking. Access synchronized cloud todos right from your home screen!
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2.5 w-full md:w-auto mt-2 md:mt-0">
            @if (deferredPrompt()) {
              <!-- Android/Chrome Native Installer Prompt -->
              <button 
                type="button"
                id="btn-pwa-native"
                (click)="triggerNativeInstall()"
                class="flex-1 md:flex-initial text-center py-2.5 px-5 bg-white text-indigo-700 font-semibold text-sm rounded-xl hover:bg-neutral-100 transition whitespace-nowrap cursor-pointer">
                Install App
              </button>
            } @else {
              <!-- Standard Mobile Installer Guide Modal Trigger -->
              <button 
                type="button"
                id="btn-pwa-guidance"
                (click)="togglePwaGuide(true)"
                class="flex-1 md:flex-initial text-center py-2.5 px-5 bg-white text-indigo-700 font-semibold text-sm rounded-xl hover:bg-neutral-100 transition whitespace-nowrap cursor-pointer">
                How to Download
              </button>
            }
            <button 
              type="button"
              id="btn-pwa-dismiss"
              (click)="dismissInstallBanner()"
              class="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      }

      <!-- Page Header & Welcome Banner -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <div class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-indigo-600 block">Workspace</span>
          <h1 class="font-display font-medium text-2xl tracking-tight text-zinc-900">
            Welcome back, <span class="font-bold underline decoration-indigo-500/30">{{ emailPrefix() }}</span>
          </h1>
          <p class="text-zinc-500 text-sm">Organize, structure, and track your todos securely across all platforms.</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Install shortcut button in header -->
          <button 
            type="button"
            id="install-shortcut"
            (click)="togglePwaGuide(true)"
            class="fill-current inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl font-semibold text-sm transition cursor-pointer">
            <mat-icon>phone_iphone</mat-icon>
            <span>Download Web-App</span>
          </button>
          
          <button 
            type="button"
            id="logout-button"
            (click)="onLogout()"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-sm transition cursor-pointer">
            <mat-icon>power_settings_new</mat-icon>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <!-- Dashboard Stats Grid -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Card -->
        <div class="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div class="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <mat-icon class="text-2xl h-auto w-auto">list_alt</mat-icon>
          </div>
          <div>
            <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Total Todos</span>
            <span class="text-2xl font-bold font-display text-zinc-900">{{ todoService.stats().total }}</span>
          </div>
        </div>

        <!-- Pending Card -->
        <div class="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div class="p-3.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <mat-icon class="text-2xl h-auto w-auto">pending_actions</mat-icon>
          </div>
          <div>
            <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Pending</span>
            <span class="text-2xl font-bold font-display text-zinc-900">{{ todoService.stats().pending }}</span>
          </div>
        </div>

        <!-- Completed Card -->
        <div class="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div class="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <mat-icon class="text-2xl h-auto w-auto">assignment_turned_in</mat-icon>
          </div>
          <div>
            <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Completed</span>
            <span class="text-2xl font-bold font-display text-zinc-900">{{ todoService.stats().completed }}</span>
          </div>
        </div>

        <!-- Rate Card -->
        <div class="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Completion Velocity</span>
            <span class="text-sm font-bold text-indigo-600 font-mono">{{ todoService.stats().rate }}%</span>
          </div>
          <div class="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              class="h-full bg-indigo-600 rounded-full transition-all duration-500"
              [style.width.%]="todoService.stats().rate">
            </div>
          </div>
        </div>
      </section>

      <!-- Main Columns Grid (Todo Creator Content on left/right depending on screen) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Form Creator (5 cols) -->
        <div class="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <mat-icon class="text-indigo-600">add_task</mat-icon>
            <h2 class="font-display font-medium text-lg text-zinc-900">Add New Task</h2>
          </div>

          <form [formGroup]="todoForm" (ngSubmit)="onCreateTask()" id="todo-form" class="space-y-4">
            
            <!-- Task Title -->
            <div class="space-y-1.5">
              <label for="task-title" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600">Task Title</label>
              <input 
                type="text" 
                id="task-title"
                formControlName="title"
                placeholder="What needs to be done?"
                class="block w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              @if (todoForm.get('title')?.touched && todoForm.get('title')?.invalid) {
                <span class="text-rose-600 text-xs font-semibold block">Task title is required.</span>
              }
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <label for="task-desc" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600">Description (Optional)</label>
              <textarea 
                id="task-desc" 
                formControlName="description"
                placeholder="Add some optional reference details..."
                rows="3"
                class="block w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"></textarea>
            </div>

            <!-- Priority -->
            <div class="space-y-1.5">
              <span class="block text-xs font-semibold uppercase tracking-wider text-zinc-600">Priority Weight</span>
              <div class="grid grid-cols-3 gap-2.5">
                <button 
                  type="button" 
                  (click)="setPriority('low')"
                  class="py-2 px-3 text-center text-sm font-medium border rounded-xl transition cursor-pointer"
                  [class.bg-emerald-50]="selectedPriority() === 'low'"
                  [class.text-emerald-700]="selectedPriority() === 'low'"
                  [class.border-emerald-300]="selectedPriority() === 'low'"
                  [class.bg-zinc-50]="selectedPriority() !== 'low'"
                  [class.text-zinc-500]="selectedPriority() !== 'low'"
                  [class.border-zinc-200]="selectedPriority() !== 'low'">
                  Low
                </button>
                <button 
                  type="button" 
                  (click)="setPriority('medium')"
                  class="py-2 px-3 text-center text-sm font-medium border rounded-xl transition cursor-pointer"
                  [class.bg-amber-50]="selectedPriority() === 'medium'"
                  [class.text-amber-700]="selectedPriority() === 'medium'"
                  [class.border-amber-300]="selectedPriority() === 'medium'"
                  [class.bg-zinc-50]="selectedPriority() !== 'medium'"
                  [class.text-zinc-500]="selectedPriority() !== 'medium'"
                  [class.border-zinc-200]="selectedPriority() !== 'medium'">
                  Medium
                </button>
                <button 
                  type="button" 
                  (click)="setPriority('high')"
                  class="py-2 px-3 text-center text-sm font-medium border rounded-xl transition cursor-pointer"
                  [class.bg-rose-50]="selectedPriority() === 'high'"
                  [class.text-rose-700]="selectedPriority() === 'high'"
                  [class.border-rose-300]="selectedPriority() === 'high'"
                  [class.bg-zinc-50]="selectedPriority() !== 'high'"
                  [class.text-zinc-500]="selectedPriority() !== 'high'"
                  [class.border-zinc-200]="selectedPriority() !== 'high'">
                  High
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Category Selector -->
              <div class="space-y-1.5">
                <label for="task-cat" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600">Category</label>
                <select 
                  id="task-cat"
                  formControlName="category"
                  class="block w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="General">General</option>
                  @if (customCreatedCategory()) {
                    <option [value]="customCreatedCategory()">{{ customCreatedCategory() }}</option>
                  }
                </select>
              </div>

              <!-- Due Date -->
              <div class="space-y-1.5">
                <label for="task-due" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600">Due Date</label>
                <input 
                  type="date" 
                  id="task-due"
                  formControlName="dueDate"
                  class="block w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
            </div>

            <!-- Custom Category creation trigger -->
            <div class="flex items-center justify-between text-xs pt-1">
              <span class="text-zinc-500">Missing a custom category layout?</span>
              <button 
                type="button" 
                (click)="toggleCustomCategoryInput(true)"
                class="font-semibold text-indigo-600 hover:text-indigo-800 transition underline cursor-pointer">
                + Create Label
              </button>
            </div>

            <!-- New Custom Category Input Overlay inside card -->
            @if (showCustomCategoryInput()) {
              <div class="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2 mt-2">
                <span class="text-xs font-semibold text-zinc-700">Add Custom Label</span>
                <div class="flex gap-2">
                  <input 
                    type="text" 
                    #newCatInput
                    placeholder="e.g. Finance, Goals..."
                    class="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-indigo-500" />
                  <button 
                    type="button"
                    (click)="saveCustomCategory(newCatInput.value)"
                    class="py-1.5 px-3 bg-indigo-600 text-white font-medium text-xs rounded-lg hover:bg-indigo-700 transition cursor-pointer">
                    Save
                  </button>
                  <button 
                    type="button"
                    (click)="toggleCustomCategoryInput(false)"
                    class="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg transition cursor-pointer">
                    <mat-icon class="text-sm">close</mat-icon>
                  </button>
                </div>
              </div>
            }

            <button 
              type="submit" 
              id="btn-add-todo"
              [disabled]="todoForm.invalid"
              class="w-full mt-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-semibold text-sm rounded-xl border border-zinc-950/10 shadow hover:shadow-md cursor-pointer transition flex items-center justify-center gap-2">
              <mat-icon>add</mat-icon>
              <span>Add to Cloud Database</span>
            </button>
          </form>
        </div>

        <!-- Right: Task Sorters, Filters & Real-time Task List (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- Filters & Sort Options Header Bar -->
          <div class="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
            
            <!-- Searching & Sorting Row -->
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative flex-1 rounded-xl shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <mat-icon class="text-lg">search</mat-icon>
                </div>
                <input 
                  type="text" 
                  id="search-box"
                  [value]="todoService.searchQuery()"
                  (input)="onSearchChange($event)"
                  placeholder="Query titles or descriptions..."
                  class="block w-full pl-11 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                @if (todoService.searchQuery()) {
                  <button 
                    type="button" 
                    (click)="clearSearch()"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer">
                    <mat-icon class="text-lg">cancel</mat-icon>
                  </button>
                }
              </div>

              <!-- Sorter Dropdown -->
              <div class="relative flex-shrink-0 min-w-[150px]">
                <select 
                  id="sort-select"
                  [value]="todoService.sortBy()"
                  (change)="onSortChange($event)"
                  class="block w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
                  <option value="createdAt">Newest First</option>
                  <option value="dueDate">Due Date Limit</option>
                  <option value="priority">High Priority</option>
                </select>
              </div>
            </div>

            <!-- Horizontal Tab Segment Toggles (All / Pending / Completed) -->
            <div class="flex border-b border-zinc-100 pb-2">
              <button 
                type="button" 
                (click)="setStatusFilter('All')"
                class="py-1.5 px-4 font-medium text-xs rounded-lg transition-all cursor-pointer"
                [class.bg-zinc-150]="todoService.statusFilter() === 'All'"
                [class.text-zinc-900]="todoService.statusFilter() === 'All'"
                [class.text-zinc-400]="todoService.statusFilter() !== 'All'"
                [class.hover:text-zinc-600]="todoService.statusFilter() !== 'All'">
                All ({{ todoService.todos().length }})
              </button>
              <button 
                type="button" 
                (click)="setStatusFilter('Pending')"
                class="py-1.5 px-4 font-medium text-xs rounded-lg transition-all cursor-pointer"
                [class.bg-zinc-150]="todoService.statusFilter() === 'Pending'"
                [class.text-zinc-900]="todoService.statusFilter() === 'Pending'"
                [class.text-zinc-400]="todoService.statusFilter() !== 'Pending'"
                [class.hover:text-zinc-600]="todoService.statusFilter() !== 'Pending'">
                Pending ({{ todoService.stats().pending }})
              </button>
              <button 
                type="button" 
                (click)="setStatusFilter('Completed')"
                class="py-1.5 px-4 font-medium text-xs rounded-lg transition-all cursor-pointer"
                [class.bg-zinc-150]="todoService.statusFilter() === 'Completed'"
                [class.text-zinc-900]="todoService.statusFilter() === 'Completed'"
                [class.text-zinc-400]="todoService.statusFilter() !== 'Completed'"
                [class.hover:text-zinc-600]="todoService.statusFilter() !== 'Completed'">
                Completed ({{ todoService.stats().completed }})
              </button>
            </div>

            <!-- Advanced Category & Priority Pill Selectors -->
            <div class="space-y-3.5 pt-1">
              <!-- Grid categories map -->
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-2">Category:</span>
                <button 
                  type="button"
                  (click)="setCategoryFilter('All')"
                  [class]="getCategoryPillStyle(todoService.categoryFilter() === 'All')"
                  class="cursor-pointer">
                  All
                </button>
                @for (cat of todoService.availableCategories(); track cat) {
                  <button 
                    type="button"
                    (click)="setCategoryFilter(cat)"
                    [class]="getCategoryPillStyle(todoService.categoryFilter() === cat)"
                    class="cursor-pointer">
                    {{ cat }}
                  </button>
                }
              </div>

              <!-- Priorities list row -->
              <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span class="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-2">Priority:</span>
                <button 
                  type="button"
                  (click)="setPriorityFilter('All')"
                  [class]="getPriorityPillStyle('All', todoService.priorityFilter() === 'All')"
                  class="cursor-pointer">
                  All
                </button>
                <button 
                  type="button"
                  (click)="setPriorityFilter('low')"
                  [class]="getPriorityPillStyle('low', todoService.priorityFilter() === 'low')"
                  class="cursor-pointer">
                  Low
                </button>
                <button 
                  type="button"
                  (click)="setPriorityFilter('medium')"
                  [class]="getPriorityPillStyle('medium', todoService.priorityFilter() === 'medium')"
                  class="cursor-pointer">
                  Medium
                </button>
                <button 
                  type="button"
                  (click)="setPriorityFilter('high')"
                  [class]="getPriorityPillStyle('high', todoService.priorityFilter() === 'high')"
                  class="cursor-pointer">
                  High
                </button>
              </div>
            </div>
          </div>

          <!-- Dynamic Todo Item list wrapper -->
          <div class="space-y-3.5">
            
            <!-- Real-time Loading State indicator -->
            @if (todoService.todosLoading()) {
              <div class="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center space-y-3">
                <div class="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <span class="text-zinc-500 text-sm font-medium">Synchronizing secure cloud instances...</span>
              </div>
            } @else {
              
              <!-- Empty state view -->
              @if (todoService.filteredAndSortedTodos().length === 0) {
                <div class="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-sm space-y-4">
                  <div class="inline-flex items-center justify-center w-16 h-16 bg-zinc-50 text-zinc-400 rounded-2xl border border-zinc-100">
                    <mat-icon class="text-3xl h-auto w-auto">content_paste_off</mat-icon>
                  </div>
                  <div class="space-y-1">
                    <h3 class="font-display font-bold text-lg text-zinc-800">No active todos found</h3>
                    <p class="text-zinc-500 text-sm max-w-sm mx-auto">
                      Adjust your search parameters or category filter caps to locate, or create a brand new task.
                    </p>
                  </div>
                  @if (hasActiveFilters()) {
                    <button 
                      type="button"
                      id="clear-filters-btn"
                      (click)="resetAllFilters()"
                      class="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer">
                      Reset Filter Capsules
                    </button>
                  }
                </div>
              } @else {

                <!-- Loop with transitions and visual states -->
                @for (task of todoService.filteredAndSortedTodos(); track task.id) {
                  <article 
                    class="bg-white border rounded-2xl p-4 shadow-sm flex items-start gap-4 transition-all duration-200"
                    [class.border-zinc-200]="!task.completed"
                    [class.border-indigo-100]="task.completed"
                    [class.bg-zinc-50/40]="task.completed">
                    
                    <!-- Checkbox Toggle -->
                    <button 
                      type="button"
                      (click)="toggleTaskCompleted(task)"
                      class="flex-shrink-0 mt-1 cursor-pointer">
                      <mat-icon 
                        [class.text-indigo-600]="task.completed"
                        [class.text-zinc-300]="!task.completed"
                        [class.hover:text-indigo-400]="!task.completed"
                        class="text-2xl transition">
                        {{ task.completed ? 'check_circle' : 'radio_button_unchecked' }}
                      </mat-icon>
                    </button>

                    <!-- Content Details -->
                    <div class="flex-1 min-w-0 space-y-1.5">
                      
                      <!-- Inline Edit Panel if editMode active -->
                      @if (activeEditId() === task.id) {
                        <div class="space-y-3.5 bg-zinc-50 border border-zinc-200 p-3 rounded-xl">
                          <input 
                            type="text" 
                            #editTitle
                            [value]="task.title"
                            class="block w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none" />
                          <textarea 
                            #editDesc
                            [value]="task.description"
                            rows="2"
                            class="block w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs placeholder-zinc-400 resize-none focus:outline-none"></textarea>
                          
                          <div class="flex items-center gap-1.5 pt-1 justify-end">
                            <button 
                              type="button"
                              (click)="saveInlineEdit(task.id, editTitle.value, editDesc.value)"
                              class="px-3 py-1.5 bg-zinc-950 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition cursor-pointer">
                              Accept
                            </button>
                            <button 
                              type="button"
                              (click)="cancelInlineEdit()"
                              class="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-lg hover:bg-zinc-50 transition cursor-pointer">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      } @else {
                        <!-- Regular details -->
                        <div class="space-y-1">
                          <h3 
                            class="font-display font-medium text-base text-zinc-900 leading-tight transition"
                            [class.line-through]="task.completed"
                            [class.text-zinc-400]="task.completed">
                            {{ task.title }}
                          </h3>
                          @if (task.description) {
                            <p 
                              class="text-zinc-600 text-sm leading-relaxed"
                              [class.line-through]="task.completed"
                              [class.text-zinc-400]="task.completed">
                              {{ task.description }}
                            </p>
                          }
                        </div>
                      }

                      <!-- Metadata row -->
                      <div class="flex flex-wrap items-center gap-2 text-xs">
                        <!-- Category badge -->
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md font-medium text-zinc-600 bg-zinc-100 uppercase tracking-wide border border-zinc-200/50">
                          {{ task.category }}
                        </span>

                        <!-- Priority Badge -->
                        @if (task.priority === 'high') {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-700 border border-red-100">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            CRITICAL
                          </span>
                        } @else if (task.priority === 'medium') {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            NORMAL
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
                            LOW
                          </span>
                        }

                        <!-- Due-Date visual state with check for overdue -->
                        @if (task.dueDate) {
                          <span 
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
                            [class.bg-red-50]="isOverdue(task)"
                            [class.text-red-700]="isOverdue(task)"
                            [class.border]="isOverdue(task)"
                            [class.border-red-100]="isOverdue(task)"
                            [class.text-zinc-500]="!isOverdue(task)"
                            [class.bg-zinc-50]="!isOverdue(task)">
                            <mat-icon class="text-xs h-auto w-auto">event</mat-icon>
                            <span>{{ formatFriendlyDate(task.dueDate) }}</span>
                            @if (isOverdue(task)) {
                              <span class="text-[9px] font-bold uppercase tracking-wider pl-0.5 animate-pulse">OVERDUE</span>
                            }
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Actions Panel -->
                    <div class="flex items-center gap-1 flex-shrink-0 self-center">
                      @if (activeEditId() !== task.id) {
                        <button 
                          type="button"
                          (click)="triggerInlineEdit(task.id)"
                          title="Edit Task"
                          class="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition cursor-pointer">
                          <mat-icon class="text-base">edit</mat-icon>
                        </button>
                      }
                      <button 
                        type="button"
                        (click)="deleteTask(task.id)"
                        title="Delete Task"
                        class="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer">
                        <mat-icon class="text-base">delete_outline</mat-icon>
                      </button>
                    </div>

                  </article>
                }
              }
            }

          </div>
        </div>
      </div>
    </div>

    <!-- PWA Download Guideline Modal Overlay (For Mobile Devices & Hand-guide) -->
    @if (showPwaGuide()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden p-6 space-y-6">
          
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <h2 class="font-display font-bold text-xl text-zinc-900 leading-snug">Download to Mobile Device</h2>
              <p class="text-zinc-500 text-sm">Save TaskFlow directly to your phone's home screen for PWA speed access.</p>
            </div>
            <button 
              type="button"
              (click)="togglePwaGuide(false)"
              class="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-full transition cursor-pointer">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            <!-- iOS Instructions -->
            <div class="bg-zinc-50 border border-zinc-200/50 p-4 rounded-2xl space-y-3.5">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
                  <mat-icon class="text-sm h-auto w-auto">phone_iphone</mat-icon>
                </div>
                <h4 class="font-semibold text-sm text-zinc-900">Apple iOS Safari</h4>
              </div>
              <ol class="text-xs text-zinc-600 space-y-2 list-decimal pl-4 leading-relaxed">
                <li>Load TaskFlow within Apple <strong>Safari browser</strong>.</li>
                <li>Tap the <strong>Share</strong> button <mat-icon class="text-xs align-middle inline-block">share</mat-icon> in the bottom bar.</li>
                <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                <li>Enter task preference name and touch <strong>Add</strong>.</li>
              </ol>
            </div>

            <!-- Android Instructions -->
            <div class="bg-zinc-50 border border-zinc-200/50 p-4 rounded-2xl space-y-3.5">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
                  <mat-icon class="text-sm h-auto w-auto">phone_android</mat-icon>
                </div>
                <h4 class="font-semibold text-sm text-zinc-900">Android Chrome</h4>
              </div>
              <ol class="text-xs text-zinc-600 space-y-2 list-decimal pl-4 leading-relaxed">
                <li>Explore TaskFlow within <strong>Chrome browser</strong>.</li>
                <li>Tap the <strong>Menu (3 dots)</strong> button in top right.</li>
                <li>Tap on <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li>
                <li>Follow native prompt instruction card parameters.</li>
              </ol>
            </div>
          </div>

          <!-- Bottom Footer details -->
          <div class="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center gap-3">
            <mat-icon class="text-indigo-600">offline_pin</mat-icon>
            <div class="text-xs text-indigo-900 leading-normal">
              <strong>Offline Sync Ready:</strong> Installed apps automatically enable local IndexedDB storage, let people write files on train networks or tunnels, caching updates and sync the database when back!
            </div>
          </div>

          <div class="flex justify-end pt-1">
            <button 
              type="button"
              (click)="togglePwaGuide(false)"
              class="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm rounded-xl transition cursor-pointer">
              Understood
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class TodoDashboard implements OnInit {
  todoService = inject(TodoService);
  fb = inject(FormBuilder);

  todoForm: FormGroup;
  selectedPriority = signal<'high' | 'medium' | 'low'>('medium');
  customCreatedCategory = signal<string>('');
  showCustomCategoryInput = signal<boolean>(false);
  activeEditId = signal<string | null>(null);

  // PWA elements
  showInstallBanner = signal<boolean>(false);
  showPwaGuide = signal<boolean>(false);
  deferredPrompt = signal<{ prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  // Email Prefix calculated
  emailPrefix = computed(() => {
    const email = this.todoService.currentUser()?.email || '';
    return email.split('@')[0];
  });

  constructor() {
    this.todoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: ['Personal'],
      dueDate: [''],
    });
  }

  ngOnInit() {
    this.checkPwaInstallability();
  }

  // --- Dynamic CSS Helpers ---
  getCategoryPillStyle(isActive: boolean): string {
    const common = 'px-3 py-1 text-xs font-semibold rounded-full transition-all border';
    if (isActive) {
      return `${common} bg-indigo-600 text-white border-indigo-600 shadow-sm`;
    }
    return `${common} bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border-zinc-200`;
  }

  getPriorityPillStyle(type: string, isActive: boolean): string {
    const common = 'px-3 py-1 text-xs font-semibold rounded-full transition-all border capitalize';
    
    if (!isActive) {
      return `${common} bg-zinc-50 text-zinc-500 hover:bg-zinc-100 border-zinc-200`;
    }

    if (type === 'high') {
      return `${common} bg-red-600 text-white border-red-600 shadow-sm`;
    } else if (type === 'medium') {
      return `${common} bg-amber-500 text-white border-amber-500 shadow-sm`;
    } else if (type === 'low') {
      return `${common} bg-emerald-600 text-white border-emerald-600 shadow-sm`;
    }
    return `${common} bg-indigo-600 text-white border-indigo-600`;
  }

  // --- Form Handlers ---
  setPriority(p: 'high' | 'medium' | 'low') {
    this.selectedPriority.set(p);
  }

  toggleCustomCategoryInput(show: boolean) {
    this.showCustomCategoryInput.set(show);
  }

  saveCustomCategory(val: string) {
    const name = val.trim();
    if (name) {
      this.customCreatedCategory.set(name);
      this.todoForm.patchValue({ category: name });
      this.showCustomCategoryInput.set(false);
    }
  }

  async onCreateTask() {
    if (this.todoForm.invalid) return;

    const { title, description, category, dueDate } = this.todoForm.value;

    try {
      await this.todoService.addTask({
        title: title.trim(),
        description: description ? description.trim() : '',
        category,
        priority: this.selectedPriority(),
        dueDate: dueDate || null,
        completed: false
      });
      
      // Reset form controls except default category
      this.todoForm.patchValue({
        title: '',
        description: '',
        dueDate: ''
      });
      this.selectedPriority.set('medium');
      this.todoForm.get('title')?.markAsUntouched();
    } catch (e) {
      console.error('Error triggered on task creation:', e);
    }
  }

  // --- Inline Edit Core logic ---
  triggerInlineEdit(id: string) {
    this.activeEditId.set(id);
  }

  cancelInlineEdit() {
    this.activeEditId.set(null);
  }

  async saveInlineEdit(id: string, newTitle: string, newDesc: string) {
    const title = newTitle.trim();
    if (!title) return;

    try {
      await this.todoService.updateTask(id, {
        title,
        description: newDesc ? newDesc.trim() : ''
      });
      this.activeEditId.set(null);
    } catch (e) {
      console.error('Error saving inline task edits:', e);
    }
  }

  // --- Filter and Search events ---
  onSearchChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.todoService.searchQuery.set(val);
  }

  clearSearch() {
    this.todoService.searchQuery.set('');
  }

  onSortChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as 'dueDate' | 'priority' | 'createdAt';
    this.todoService.sortBy.set(val);
  }

  setStatusFilter(status: string) {
    this.todoService.statusFilter.set(status);
  }

  setCategoryFilter(cat: string) {
    this.todoService.categoryFilter.set(cat);
  }

  setPriorityFilter(priority: string) {
    this.todoService.priorityFilter.set(priority);
  }

  hasActiveFilters(): boolean {
    return this.todoService.searchQuery() !== '' || 
           this.todoService.categoryFilter() !== 'All' || 
           this.todoService.priorityFilter() !== 'All' || 
           this.todoService.statusFilter() !== 'All';
  }

  resetAllFilters() {
    this.todoService.searchQuery.set('');
    this.todoService.categoryFilter.set('All');
    this.todoService.priorityFilter.set('All');
    this.todoService.statusFilter.set('All');
  }

  // --- Database Task CRUD proxy operations ---
  async toggleTaskCompleted(task: Task) {
    try {
      await this.todoService.updateTask(task.id, {
        completed: !task.completed
      });
    } catch (e) {
      console.error('Error updating checkbox completed status:', e);
    }
  }

  async deleteTask(id: string) {
    try {
      await this.todoService.deleteTask(id);
    } catch (e) {
      console.error('Error deleting task document:', e);
    }
  }

  // --- Date Formatter helpers ---
  formatFriendlyDate(dStr: string): string {
    const date = new Date(dStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  isOverdue(task: Task): boolean {
    if (task.completed || !task.dueDate) return false;
    const target = new Date(task.dueDate).setHours(23, 59, 59, 999);
    return target < Date.now();
  }

  // --- PWA Installation Core Functions ---
  checkPwaInstallability() {
    // Check if user previously dismissed banner
    const dismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';
    if (!dismissed) {
      this.showInstallBanner.set(true);
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: Event) {
    // Chrome / Android will trigger this event if the app matches criteria
    e.preventDefault();
    this.deferredPrompt.set(e as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    this.showInstallBanner.set(true);
  }

  triggerNativeInstall() {
    const promptEvent = this.deferredPrompt();
    if (!promptEvent) return;

    const eventWithPrompt = promptEvent as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
    eventWithPrompt.prompt();
    eventWithPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User completed installation choice registration');
        this.dismissInstallBanner();
      }
      this.deferredPrompt.set(null);
    });
  }

  togglePwaGuide(show: boolean) {
    this.showPwaGuide.set(show);
  }

  dismissInstallBanner() {
    this.showInstallBanner.set(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  }

  // --- Logout Trigger ---
  async onLogout() {
    try {
      await this.todoService.logout();
    } catch (e) {
      console.error('Authentication logout error:', e);
    }
  }
}
