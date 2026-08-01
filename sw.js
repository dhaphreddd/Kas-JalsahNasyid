const CACHE_NAME = 'kas-jalsah-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './src/firebase.js',
  './src/ui.js',
  './src/auth.js',
  './src/dashboard.js',
  './src/transactions.js',
  './src/reports.js',
  './src/users.js',
  './src/app.js'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-First falling back to cache for API/firebase, cache-first for local static)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Exclude Firebase Firestore/Auth network calls from caching
  if (url.origin.includes('firestore.googleapis.com') || url.origin.includes('identitytoolkit.googleapis.com')) {
    return; // let browser handle it directly without intercepting
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache for next time
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {/* Ignore network fail in background */});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
