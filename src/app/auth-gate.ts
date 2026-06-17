import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TodoService } from './todo-service';

@Component({
  selector: 'app-auth-gate',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Secure Branding Header -->
        <div class="flex justify-center">
          <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span class="material-icons text-white text-3xl">task_alt</span>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 font-sans">
          TaskFlow Pro
        </h2>
        <p class="mt-2 text-center text-sm text-slate-500">
          Enterprise Security • End-to-End Encrypted Sessions
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          
          <!-- Mode Switcher Tabs -->
          <div class="flex border-b border-slate-100 mb-6">
            <button 
              type="button" 
              (click)="setMode('signin')"
              [class]="mode() === 'signin' ? 'border-indigo-600 text-indigo-600 font-semibold border-b-2' : 'border-transparent text-slate-400'"
              class="flex-1 pb-3 text-sm text-center transition-all focus:outline-none">
              Sign In
            </button>
            <button 
              type="button" 
              (click)="setMode('signup')"
              [class]="mode() === 'signup' ? 'border-indigo-600 text-indigo-600 font-semibold border-b-2' : 'border-transparent text-slate-400'"
              class="flex-1 pb-3 text-sm text-center transition-all focus:outline-none">
              Create Account
            </button>
          </div>

          <!-- Authentication forms -->
          <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-5">
            @if (mode() === 'signup') {
              <div>
                <label for="username" class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Display Username
                </label>
                <div class="relative">
                  <span class="material-icons absolute left-3 top-2.5 text-slate-400 text-lg">person_outline</span>
                  <input 
                    id="username" 
                    type="text" 
                    formControlName="username"
                    placeholder="Your Name or Alias" 
                    class="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"/>
                </div>
              </div>
            }

            <div>
              <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div class="relative">
                <span class="material-icons absolute left-3 top-2.5 text-slate-400 text-lg">mail_outline</span>
                <input 
                  id="email" 
                  type="email" 
                  formControlName="email"
                  placeholder="name@company.com" 
                  class="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"/>
              </div>
            </div>

            <div>
              <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div class="relative">
                <span class="material-icons absolute left-3 top-2.5 text-slate-400 text-lg">lock_outline</span>
                <input 
                  id="password" 
                  type="password" 
                  formControlName="password"
                  placeholder="••••••••" 
                  class="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"/>
              </div>
            </div>

            <!-- SHA-256 Cryptographic Shield badge -->
            <div class="flex items-center gap-2 justify-center py-2 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 font-medium font-sans">
              <span class="material-icons text-emerald-500 text-sm">lock</span>
              Crypto-secure: Local SHA-256 Hashing Enforced
            </div>

            <!-- Validation/Error messages -->
            @if (localError()) {
              <div class="rounded-lg bg-rose-50 border border-rose-200 p-3 flex gap-2">
                <span class="material-icons text-rose-500 text-lg">error_outline</span>
                <span class="text-xs text-rose-700 font-medium leading-normal">{{ localError() }}</span>
              </div>
            }

            @if (todoService.authError()) {
              <div class="rounded-lg bg-rose-50 border border-rose-200 p-3 flex gap-2">
                <span class="material-icons text-rose-500 text-lg">error_outline</span>
                <span class="text-xs text-rose-700 font-medium leading-normal">{{ todoService.authError() }}</span>
              </div>
            }

            <div>
              <button 
                type="submit" 
                [disabled]="todoService.authLoading()"
                class="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                @if (todoService.authLoading()) {
                  <span class="animate-spin border-2 border-white border-t-transparent w-4 h-4 rounded-full"></span>
                  Processing Secure Session...
                } @else {
                  <span class="material-icons text-base">verified_user</span>
                  {{ mode() === 'signin' ? 'Verify Credentials' : 'Register Secure Channel' }}
                }
              </button>
            </div>
          </form>

          <!-- Security note -->
          <div class="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
            <span class="material-icons text-emerald-500 text-sm">security</span>
            Secure encrypted socket session
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AuthGate {
  todoService = inject(TodoService);

  mode = signal<'signin' | 'signup'>('signin');
  localError = signal<string | null>(null);

  authForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    username: new FormControl('', [])
  });

  setMode(m: 'signin' | 'signup') {
    this.mode.set(m);
    this.localError.set(null);
  }

  async onSubmit() {
    if (this.authForm.invalid) {
      this.localError.set('Please make sure you entered a valid email and custom password (at least 6 characters).');
      return;
    }

    this.localError.set(null);
    const email = this.authForm.value.email || '';
    const password = this.authForm.value.password || '';
    const username = this.authForm.value.username || '';

    if (this.mode() === 'signup' && !username.trim()) {
      this.localError.set('Please provide a Display Username to identify your workspace.');
      return;
    }

    try {
      if (this.mode() === 'signin') {
        await this.todoService.signIn(email, password);
      } else {
        await this.todoService.signUp(email, password, username.trim());
      }
    } catch (error) {
      // Decode user-friendly messages for common firebase errors
      const e = error as { message?: string; code?: string };
      let msg = e.message || 'An error occurred. Please try again.';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        msg = 'Invalid credentials. Please verify and try again.';
      } else if (e.code === 'auth/email-already-in-use') {
        msg = 'This email user account is already active.';
      } else if (e.code === 'auth/weak-password') {
        msg = 'Your security key must be stronger, at least 6 characters.';
      } else if (e.code === 'auth/invalid-email') {
        msg = 'The email address is not configured properly.';
      }
      this.localError.set(msg);
    }
  }
}
