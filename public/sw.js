// Service Worker for Nigeria Homes Platform
// Provides caching, offline functionality, and performance optimization

const CACHE_NAME = 'nigeria-homes-v1.0.0';
const STATIC_CACHE_NAME = 'nigeria-homes-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'nigeria-homes-dynamic-v1.0.0';
const API_CACHE_NAME = 'nigeria-homes-api-v1.0.0';

// Cache duration in milliseconds - Nigerian network optimized
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,    // 1 day
  API: 5 * 60 * 1000,              // 5 minutes
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
  // Nigerian network specific
  NIGERIAN_2G: 30 * 60 * 1000,     // 30 minutes for 2G
  NIGERIAN_3G: 15 * 60 * 1000,     // 15 minutes for 3G
  NIGERIAN_4G: 5 * 60 * 1000,      // 5 minutes for 4G
};

// Nigerian network detection and optimization
function getNigerianNetworkType() {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return connection.effectiveType || 'unknown';
  }
  return 'unknown';
}

function getNigerianOptimizedTTL(networkType) {
  switch (networkType) {
    case '2g': return CACHE_DURATION.NIGERIAN_2G;
    case '3g': return CACHE_DURATION.NIGERIAN_3G;
    case '4g': return CACHE_DURATION.NIGERIAN_4G;
    default: return CACHE_DURATION.API;
  }
}

// Files to cache immediately (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files here
  // These will be populated during build process
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/properties',
  '/api/locations',
  '/api/amenities',
  // Add other cacheable API endpoints
];

// Files that should never be cached
const NEVER_CACHE = [
  '/api/auth/',
  '/api/payments/',
  '/api/admin/',
  '/sw.js',
  '/workbox-',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('nigeria-homes-') && 
                     !cacheName.includes('v1.0.0');
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip requests that should never be cached
  if (NEVER_CACHE.some(pattern => url.pathname.includes(pattern))) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
  
  if (!isCacheable) {
    // Non-cacheable API requests go directly to network
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME);
      const responseClone = networkResponse.clone();
      
      // Add timestamp for cache expiration
      const response = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString(),
        },
      });
      
      cache.put(request, response);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed, trying cache for API:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const isExpired = cachedAt && (Date.now() - parseInt(cachedAt)) > CACHE_DURATION.API;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This data is not available offline',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const isExpired = cachedAt && (Date.now() - parseInt(cachedAt)) > CACHE_DURATION.IMAGES;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the image
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const responseClone = networkResponse.clone();
      
      const response = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString(),
        },
      });
      
      cache.put(request, response);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Image request failed:', request.url);
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder image
    return new Response(
      '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Image unavailable offline</text></svg>',
      {
        headers: { 'Content-Type': 'image/svg+xml' },
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Static asset request failed:', request.url);
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle navigation requests with network-first, fallback to cache
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to cached index.html for SPA routing
    const indexResponse = await caches.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }
    
    // Return offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nigeria Homes - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   text-align: center; padding: 50px; background: #f9fafb; }
            .container { max-width: 400px; margin: 0 auto; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #374151; margin-bottom: 10px; }
            p { color: #6b7280; margin-bottom: 30px; }
            button { background: #059669; color: white; border: none; padding: 12px 24px; 
                     border-radius: 6px; cursor: pointer; font-size: 16px; }
            button:hover { background: #047857; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🏠</div>
            <h1>You're Offline</h1>
            <p>Nigeria Homes is not available right now. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// Helper functions
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         url.pathname.startsWith('/assets/') ||
         url.pathname.startsWith('/fonts/');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-payments') {
    event.waitUntil(syncOfflinePayments());
  } else if (event.tag === 'background-sync-maintenance') {
    event.waitUntil(syncOfflineMaintenanceRequests());
  }
});

// Sync offline payments when connection is restored
async function syncOfflinePayments() {
  try {
    // Get offline payment data from IndexedDB
    const offlinePayments = await getOfflineData('payments');
    
    for (const payment of offlinePayments) {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment),
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineData('payments', payment.id);
          
          // Notify user of successful sync
          self.registration.showNotification('Payment Processed', {
            body: `Your payment of ₦${payment.amount} has been processed.`,
            icon: '/icons/icon-192x192.png',
            tag: 'payment-sync',
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync payment:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync offline maintenance requests
async function syncOfflineMaintenanceRequests() {
  try {
    const offlineRequests = await getOfflineData('maintenance');
    
    for (const request of offlineRequests) {
      try {
        const response = await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        
        if (response.ok) {
          await removeOfflineData('maintenance', request.id);
          
          self.registration.showNotification('Maintenance Request Submitted', {
            body: `Your maintenance request "${request.title}" has been submitted.`,
            icon: '/icons/icon-192x192.png',
            tag: 'maintenance-sync',
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync maintenance request:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: 'You have a new notification from Nigeria Homes',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('Nigeria Homes', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Utility functions for offline data management
async function getOfflineData(storeName) {
  // This would integrate with IndexedDB
  // Simplified implementation for demo
  return [];
}

async function removeOfflineData(storeName, id) {
  // This would remove data from IndexedDB
  // Simplified implementation for demo
  console.log(`[SW] Removing offline data: ${storeName}/${id}`);
}

// Cache management utilities
async function cleanupExpiredCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('nigeria-homes-')) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        const cachedAt = response?.headers.get('sw-cached-at');
        
        if (cachedAt) {
          const age = Date.now() - parseInt(cachedAt);
          const maxAge = cacheName.includes('api') ? CACHE_DURATION.API :
                        cacheName.includes('static') ? CACHE_DURATION.STATIC :
                        CACHE_DURATION.DYNAMIC;
          
          if (age > maxAge) {
            console.log('[SW] Removing expired cache entry:', request.url);
            await cache.delete(request);
          }
        }
      }
    }
  }
}

// Periodic cache cleanup
setInterval(cleanupExpiredCache, 60 * 60 * 1000); // Every hour

console.log('[SW] Service worker loaded successfully');
