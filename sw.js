// Yaadannoo PWA Service Worker
const CACHE_NAME = 'yaadannoo-v1.0.0';
const STATIC_CACHE = 'yaadannoo-static-v1.0.0';
const DYNAMIC_CACHE = 'yaadannoo-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './favicon.ico',
  // External CDN resources
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/sweetalert/dist/sweetalert.min.js'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(err => {
        console.error('[SW] Failed to cache static files:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then(networkResponse => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Cache dynamic content
            if (shouldCacheDynamically(request)) {
              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  console.log('[SW] Caching dynamic resource:', request.url);
                  cache.put(request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(err => {
            console.log('[SW] Network fetch failed:', request.url, err);
            
            // Return offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // Return a basic offline response for other requests
            return new Response('Content not available offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Helper function to determine if a request should be cached dynamically
function shouldCacheDynamically(request) {
  const url = new URL(request.url);
  
  // Cache same-origin requests
  if (url.origin === self.location.origin) {
    return true;
  }
  
  // Cache specific external resources
  const cachableHosts = [
    'cdnjs.cloudflare.com',
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  
  return cachableHosts.some(host => url.host.includes(host));
}

// Background sync for offline note saving (future enhancement)
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'note-sync') {
    event.waitUntil(syncNotes());
  }
});

// Sync notes when back online (placeholder for future implementation)
async function syncNotes() {
  try {
    // This would sync any pending notes created while offline
    // For now, just log that sync was attempted
    console.log('[SW] Note sync completed');
    
    // Send message to main thread about sync status
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { success: true }
      });
    });
  } catch (error) {
    console.error('[SW] Note sync failed:', error);
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        data: { error: error.message }
      });
    });
  }
}

// Push notifications (for future enhancement)
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Yaadannoo',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: './'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Yaadannoo', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app not already open
        if (self.clients.openWindow) {
          return self.clients.openWindow('./');
        }
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      
      case 'CACHE_UPDATE':
        // Force update cache
        event.waitUntil(updateCache());
        break;
      
      default:
        console.log('[SW] Unknown message type:', event.data.type);
    }
  }
});

// Update cache manually
async function updateCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(STATIC_FILES);
    console.log('[SW] Cache updated successfully');
  } catch (error) {
    console.error('[SW] Cache update failed:', error);
  }
}