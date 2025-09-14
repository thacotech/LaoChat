// Service Worker for Lao Chat
const CACHE_NAME = 'lao-chat-v1.0.0';
const urlsToCache = [
  './',
  './index.html'
  // Static assets will be cached on demand
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cache opened');
        // Cache files individually to handle errors gracefully
        const cachePromises = urlsToCache.map(url => {
          console.log('SW: Attempting to cache:', url);
          return cache.add(url)
            .then(() => {
              console.log('SW: Successfully cached:', url);
            })
            .catch(err => {
              console.warn('SW: Failed to cache:', url, err);
              // Don't fail the entire installation if one file fails
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('SW: Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // Only cache certain types of requests
            const url = new URL(event.request.url);
            const shouldCache = 
              url.origin === location.origin || // Same origin
              url.hostname === 'fonts.googleapis.com' || // Google Fonts
              url.hostname === 'fonts.gstatic.com'; // Google Fonts static

            if (shouldCache) {
              // Clone the response before caching
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => {
                  console.warn('Failed to cache:', event.request.url, err);
                });
            }

            return response;
          })
          .catch(error => {
            console.warn('Fetch failed:', event.request.url, error);
            // Return a fallback response if needed
            throw error;
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('SW: Found caches:', cacheNames);
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activation complete');
      return self.clients.claim(); // Take control of all pages
    })
  );
});

// Background sync for offline messages
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle offline message queue
  return new Promise((resolve) => {
    // Implementation for syncing offline messages
    resolve();
  });
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New message from Lao Chat',
    icon: '/front/icon-192.png',
    badge: '/front/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Lao Chat', options)
  );
});