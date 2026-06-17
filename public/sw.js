// TaskFlow - Minimal web app service worker to support PWA capabilities securely.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Standard fetch proxy to ensure seamless hybrid SSR operation
  event.respondWith(fetch(event.request));
});
