import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TodoService } from './todo-service';

@Component({
  selector: 'app-auth-gate',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
        
        <!-- Header Branding -->
        <div class="px-8 pt-8 pb-4 text-center">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 border border-indigo-100 shadow-sm">
            <mat-icon class="text-3xl h-auto w-auto">verified_user</mat-icon>
          </div>
          <h1 class="font-display font-bold text-2xl text-zinc-900 tracking-tight">TaskFlow</h1>
          <p class="text-zinc-500 text-sm mt-1">Configure your personal workspace and cloud credentials.</p>
        </div>

        <!-- Mode Toggles (Sign In / Sign Up) -->
        <div class="flex border-b border-zinc-100 px-8">
          <button 
            type="button"
            id="tab-signin"
            (click)="setMode('login')"
            class="flex-1 py-3 text-center text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer"
            [class.border-indigo-600]="isLoginMode()"
            [class.text-indigo-600]="isLoginMode()"
            [class.border-transparent]="!isLoginMode()"
            [class.text-zinc-400]="!isLoginMode()"
            [class.hover:text-zinc-600]="!isLoginMode()">
            Sign In
          </button>
          <button 
            type="button"
            id="tab-signup"
            (click)="setMode('signup')"
            class="flex-1 py-3 text-center text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer"
            [class.border-indigo-600]="!isLoginMode()"
            [class.text-indigo-600]="!isLoginMode()"
            [class.border-transparent]="isLoginMode()"
            [class.text-zinc-400]="isLoginMode()"
            [class.hover:text-zinc-600]="isLoginMode()">
            Create Account
          </button>
        </div>

        <div class="p-8">
          <!-- Loading Overlay -->
          @if (todoService.authLoading()) {
            <div class="flex flex-col items-center justify-center py-8 space-y-3">
              <div class="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <span class="text-zinc-500 text-sm font-medium">Validating security handshake...</span>
            </div>
          } @else {
            
            <!-- Error Indicator -->
            @if (errorMessage()) {
              <div class="flex items-start bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 mb-6 text-sm">
                <mat-icon class="mr-2 text-rose-500 flex-shrink-0">warning</mat-icon>
                <div class="flex-1 font-medium leading-relaxed">
                  {{ errorMessage() }}
                </div>
              </div>
            }

            <!-- Auth Form -->
            <form [formGroup]="authForm" (ngSubmit)="onSubmit()" id="auth-form" class="space-y-5">
              
              <!-- Email Input -->
              <div class="space-y-1.5">
                <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600">Email Address</label>
                <div class="relative rounded-xl shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <mat-icon class="text-lg">mail_outline</mat-icon>
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    formControlName="email"
                    placeholder="you@domain.com"
                    class="block w-full pl-11 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>
                <!-- Validation -->
                @if (authForm.get('email')?.touched && authForm.get('email')?.invalid) {
                  <span class="text-rose-600 text-xs font-medium block pl-1">
                    Please provide a valid email format.
                  </span>
                }
              </div>

              <!-- Password Input -->
              <div class="space-y-1.5">
                <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600">Password</label>
                <div class="relative rounded-xl shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <mat-icon class="text-lg">lock_outline</mat-icon>
                  </div>
                  <input 
                    [type]="showPassword() ? 'text' : 'password'" 
                    id="password" 
                    formControlName="password"
                    placeholder="••••••••••••"
                    class="block w-full pl-11 pr-11 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                  <button 
                    type="button" 
                    (click)="togglePassword()"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer">
                    <mat-icon class="text-lg">{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                <!-- Validation -->
                @if (authForm.get('password')?.touched && authForm.get('password')?.invalid) {
                  <span class="text-rose-600 text-xs font-medium block pl-1">
                    Must contain at least 6 characters.
                  </span>
                }
              </div>

              <!-- Confirm Password (SIGN UP MODE ONLY) -->
              @if (!isLoginMode()) {
                <div class="space-y-1.5">
                  <label for="confirmPassword" class="block text-xs font-semibold uppercase tracking-wider text-zinc-600">Confirm Password</label>
                  <div class="relative rounded-xl shadow-sm">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <mat-icon class="text-lg">lock_reset</mat-icon>
                    </div>
                    <input 
                      [type]="showPassword() ? 'text' : 'password'" 
                      id="confirmPassword" 
                      formControlName="confirmPassword"
                      placeholder="••••••••••••"
                      class="block w-full pl-11 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                  </div>
                  @if (authForm.get('confirmPassword')?.touched && authForm.hasError('mismatch')) {
                    <span class="text-rose-600 text-xs font-medium block pl-1">
                      Passwords do not match.
                    </span>
                  }
                </div>
              }

              <!-- Demo Credentials Suggestion for Quick Testing -->
              @if (isLoginMode()) {
                <div class="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs text-zinc-500 space-y-1 mt-2">
                  <span class="font-semibold text-zinc-700">Need a quick test?</span>
                  <div class="flex justify-between items-center">
                    <span>Email: <span class="font-mono bg-white border px-1 py-0.5 rounded">demo&#64;test.com</span></span>
                    <span>Pass: <span class="font-mono bg-white border px-1 py-0.5 rounded">123456</span></span>
                    <button 
                      type="button" 
                      (click)="fillDemoCredentials()"
                      class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition underline cursor-pointer">
                      Fill
                    </button>
                  </div>
                </div>
              }

              <!-- Submit Button -->
              <button 
                type="submit" 
                id="btn-auth-submit"
                [disabled]="authForm.invalid || (todoService.authLoading() && false)"
                class="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-semibold text-sm rounded-xl transition duration-250 flex items-center justify-center space-x-2 border border-zinc-950/10 shadow hover:shadow-md cursor-pointer disabled:cursor-not-allowed">
                <mat-icon>{{ isLoginMode() ? 'lock_open' : 'person_add' }}</mat-icon>
                <span>{{ isLoginMode() ? 'Access Workspace' : 'Initialize Credentials' }}</span>
              </button>

            </form>
          }
        </div>
      </div>
    </div>
  `
})
export class AuthGate {
  todoService = inject(TodoService);
  fb = inject(FormBuilder);

  isLoginMode = signal<boolean>(true);
  showPassword = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  authForm: FormGroup;

  constructor() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const isLogin = !g.get('confirmPassword');
    if (isLogin) return null;
    
    const pass = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  setMode(mode: 'login' | 'signup') {
    this.isLoginMode.set(mode === 'login');
    this.errorMessage.set(null);
    this.authForm.reset();
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  fillDemoCredentials() {
    this.authForm.patchValue({
      email: 'demo@test.com',
      password: '123456',
      confirmPassword: '123456'
    });
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    this.errorMessage.set(null);
    const { email, password } = this.authForm.value;

    try {
      if (this.isLoginMode()) {
        await this.todoService.signIn(email, password);
      } else {
        await this.todoService.signUp(email, password);
      }
    } catch (error) {
      // Decode user-friendly messages for common firebase errors
      const e = error as { message?: string; code?: string };
      let msg = e.message || 'An error occurred. Please try again.';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        msg = 'Invalid credentials. Please verify and try again.';
      } else if (e.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Try signing in.';
      } else if (e.code === 'auth/invalid-credential') {
        msg = 'Account verification failed. Incorrect password or username.';
      }
      this.errorMessage.set(msg);
    }
  }
}
