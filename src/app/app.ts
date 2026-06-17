import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from './todo-service';
import { AuthGate } from './auth-gate';
import { TodoDashboard } from './todo-dashboard';

@Component({
  selector: 'app-root',
  imports: [CommonModule, AuthGate, TodoDashboard],
  template: `
    <!-- Top Level Routing & State guards -->
    @if (todoService.authLoading()) {
      <div class="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <div class="relative flex items-center justify-center mb-6">
          <div class="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          <span class="material-icons text-indigo-400 absolute text-2xl animate-pulse">security</span>
        </div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">TaskFlow Pro Security Console</p>
        <p class="text-[10px] text-slate-500 font-medium tracking-wide mt-1">Establishing authenticated handshake socket...</p>
      </div>
    } @else {
      @if (todoService.currentUser()) {
        <app-todo-dashboard class="block h-screen w-screen"></app-todo-dashboard>
      } @else {
        <app-auth-gate class="block min-h-screen bg-slate-50"></app-auth-gate>
      }
    }
  `,
  styles: []
})
export class App {
  todoService = inject(TodoService);
}
