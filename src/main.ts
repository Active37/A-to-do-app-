import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { App } from './app/app';

// Dynamic route routing configuration or routing stubs
bootstrapApplication(App, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter([])
  ]
}).catch(err => console.error(err));
