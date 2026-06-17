// Progressive Web App Standalone Service Worker
const CACHE_NAME = 'taskflow-pro-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

self.addEventListener('install', (e) => {
  const event = e as ExtendableEvent;
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Syncing active layouts and assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (e) => {
  const event = e as ExtendableEvent;
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning deprecated cache segments');
            return caches.delete(key);
          }
          return null;
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  const event = e as FetchEvent;
  // Dynamic proxy caching
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback for offline API request failures
        console.warn('Network unreachable - Offline Mode serving cached shell');
      });
    }) as any
  );
});
