// Service Worker for Push Notifications and Performance Optimization
// AllThingsWetaskiwin Community Hub

const CACHE_NAME = 'atw-sw-v2'; // Incremented version for new caching strategy
const STATIC_CACHE = 'atw-static-v2';
const DYNAMIC_CACHE = 'atw-dynamic-v2';
const API_CACHE = 'atw-api-v2';

// Static assets that rarely change
const staticAssets = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/manifest.json'
];

// API endpoints to cache
const apiEndpoints = [
  '/api/health',
  '/api/events',
  '/api/businesses', 
  '/api/news'
];

// Maximum cache sizes to prevent storage bloat
const MAX_CACHE_SIZE = {
  [DYNAMIC_CACHE]: 50,
  [API_CACHE]: 20
};

// Install Event - Cache resources with improved strategy
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(staticAssets);
      }),
      // Pre-cache critical API endpoints
      caches.open(API_CACHE).then(cache => {
        console.log('[SW] Precaching critical API endpoints');
        return Promise.allSettled(
          apiEndpoints.map(url => 
            fetch(url)
              .then(response => response.ok ? cache.put(url, response.clone()) : null)
              .catch(() => null) // Ignore failures during precaching
          )
        );
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Utility function to manage cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Remove oldest entries (FIFO)
    const itemsToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(itemsToDelete.map(key => cache.delete(key)));
    console.log(`[SW] Cleaned up ${itemsToDelete.length} items from ${cacheName}`);
  }
}

// Fetch Event - Improved caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (request.method !== 'GET') {
    return; // Only cache GET requests
  }

  event.respondWith(
    (async () => {
      try {
        // Strategy 1: Static assets - Cache First
        if (staticAssets.some(asset => url.pathname === asset) || 
            url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$/)) {
          
          const cachedResponse = await caches.match(request, { cacheName: STATIC_CACHE });
          if (cachedResponse) {
            return cachedResponse;
          }

          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }

        // Strategy 2: API endpoints - Network First with cache fallback
        if (url.pathname.startsWith('/api/')) {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
              const cache = await caches.open(API_CACHE);
              cache.put(request, networkResponse.clone());
              // Manage cache size
              await limitCacheSize(API_CACHE, MAX_CACHE_SIZE[API_CACHE]);
            }
            return networkResponse;
          } catch (error) {
            console.log('[SW] Network failed for API, trying cache:', url.pathname);
            const cachedResponse = await caches.match(request, { cacheName: API_CACHE });
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error;
          }
        }

        // Strategy 3: Pages - Network First with cache fallback  
        if (request.mode === 'navigate') {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
              const cache = await caches.open(DYNAMIC_CACHE);
              cache.put(request, networkResponse.clone());
              await limitCacheSize(DYNAMIC_CACHE, MAX_CACHE_SIZE[DYNAMIC_CACHE]);
            }
            return networkResponse;
          } catch (error) {
            console.log('[SW] Network failed for navigation, trying cache or offline page');
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to offline page
            return await caches.match('/offline') || new Response('Offline', { status: 503 });
          }
        }

        // Strategy 4: Other requests - Network only with error handling
        return await fetch(request);

      } catch (error) {
        console.log('[SW] Fetch failed:', error);
        
        // Return cached version if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, return offline page
        if (request.mode === 'navigate') {
          return await caches.match('/offline') || new Response('Offline', { status: 503 });
        }

        // For other requests, return error
        return new Response('Network error', { status: 503 });
      }
    })()
  );
});

// Push Event - Handle incoming push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.warn('[SW] Failed to parse push data as JSON:', e);
      data = { title: 'AllThingsWetaskiwin', body: event.data.text() || 'New notification' };
    }
  }

  const options = {
    title: data.title || 'AllThingsWetaskiwin',
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    image: data.image,
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'general',
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: Date.now(),
    vibrate: data.vibrate || [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification Click Event - Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  let url = data.url || '/';

  // Handle action button clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        url = data.viewUrl || data.url || '/';
        break;
      case 'reply':
        url = data.replyUrl || data.url || '/';
        break;
      case 'dismiss':
        return; // Just close notification
      default:
        url = data.url || '/';
    }
  }

  // Open or focus window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if there's already a window open with the target URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background Sync Event - Handle background sync
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'push-subscription') {
    event.waitUntil(syncPushSubscription());
  }
});

// Sync push subscription with server
async function syncPushSubscription() {
  try {
    const registration = await self.registration;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await fetch('/api/push/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
    }
  } catch (error) {
    console.error('[SW] Failed to sync push subscription:', error);
  }
}

// Message Event - Handle messages from main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('[SW] Service Worker script loaded');