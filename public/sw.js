/**
 * Nexo Service Worker
 * 
 * This service worker provides:
 * - Offline caching with network-first strategy
 * - Push notification handling
 * - App update management
 * - Background sync for game scores
 */

const CACHE_NAME = 'nexo-cache-v1';
const OFFLINE_URL = '/offline';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/palavras-cruzadas',
  '/sopa-de-letras',
  '/leaderboards',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Precache complete, activating immediately...');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming all clients...');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first, then cache, then offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests except for Supabase
  if (!url.origin.includes(self.location.origin) && 
      !url.origin.includes('supabase.co')) {
    return;
  }
  
  // Skip API routes - always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return a generic error response for API failures
          return new Response(
            JSON.stringify({ error: 'Sem ligação à internet' }),
            { 
              status: 503, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
    return;
  }
  
  // For page navigations - network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page if nothing cached
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // For static assets - cache first, then network
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Refresh cache in background
            fetch(request)
              .then((response) => {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              })
              .catch(() => {});
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
              return response;
            });
        })
    );
    return;
  }
  
  // Default: network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Tens uma nova notificação!',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'nexo-notification',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/',
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || '1',
      },
      actions: data.actions || [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Fechar' },
      ],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Nexo', options)
    );
  } catch (error) {
    console.error('[SW] Error handling push event:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for score submission
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncPendingScores());
  }
});

async function syncPendingScores() {
  try {
    // Get pending scores from IndexedDB
    const db = await openDatabase();
    const tx = db.transaction('pending-scores', 'readonly');
    const store = tx.objectStore('pending-scores');
    const scores = await promisifyRequest(store.getAll());
    
    for (const score of scores) {
      try {
        const response = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(score),
        });
        
        if (response.ok) {
          // Remove from pending
          const deleteTx = db.transaction('pending-scores', 'readwrite');
          const deleteStore = deleteTx.objectStore('pending-scores');
          deleteStore.delete(score.id);
          await promisifyRequest(deleteTx);
        }
      } catch (error) {
        console.error('[SW] Failed to sync score:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexo-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-scores')) {
        db.createObjectStore('pending-scores', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Message handling from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
