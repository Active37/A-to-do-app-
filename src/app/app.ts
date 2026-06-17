import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TodoService} from './todo-service';
import {AuthGate} from './auth-gate';
import {TodoDashboard} from './todo-dashboard';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, AuthGate, TodoDashboard],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  todoService = inject(TodoService);
}

