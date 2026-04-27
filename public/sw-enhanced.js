// Enhanced Service Worker for DamianixPro Platform PWA
// Optimized for Nigerian mobile networks and app-like experience

const CACHE_VERSION = '2.0.3';
const CACHE_NAME = `nigeria-homes-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `nigeria-homes-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `nigeria-homes-dynamic-v${CACHE_VERSION}`;
const API_CACHE_NAME = `nigeria-homes-api-v${CACHE_VERSION}`;
const OFFLINE_CACHE_NAME = `nigeria-homes-offline-v${CACHE_VERSION}`;

// Enhanced caching strategies for Nigerian networks
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Nigerian network-optimized cache durations
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000,     // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,        // 1 day
  API: 5 * 60 * 1000,                  // 5 minutes
  IMAGES: 30 * 24 * 60 * 60 * 1000,    // 30 days
  PROPERTIES: 15 * 60 * 1000,           // 15 minutes
  MARKET_DATA: 10 * 60 * 1000,          // 10 minutes
  // Network-specific optimizations
  SLOW_NETWORK: 60 * 60 * 1000,         // 1 hour for slow networks
  FAST_NETWORK: 5 * 60 * 1000,          // 5 minutes for fast networks
};

// Critical resources for offline functionality
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  // Critical pages
  '/properties',
  '/dashboard',
  '/analytics'
];

// Offline-first property data structure
const OFFLINE_PROPERTY_CACHE = 'offline-properties';
const OFFLINE_USER_DATA = 'offline-user-data';
const OFFLINE_SEARCH_CACHE = 'offline-searches';

// Throttle fallback logs to avoid console spam (max once per 30s per message type)
const FALLBACK_LOG_INTERVAL = 30 * 1000;
let lastPropertiesFallbackLog = 0;
let lastApiFallbackLog = 0;

// Install event - Cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Enhanced service worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        console.log('[SW] Caching critical resources');
        await Promise.all(
          CRITICAL_RESOURCES.map((resource) =>
            cache.add(resource).catch((error) => {
              console.warn('[SW] Failed to precache resource:', resource, error);
            })
          )
        );
      }),
      
      // Initialize offline storage
      initializeOfflineStorage(),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Enhanced service worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients
      self.clients.claim(),
      
      // Initialize background sync
      initializeBackgroundSync()
    ])
  );
});

// Fetch event - Enhanced request handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Vite dev server: never intercept source modules, deps, or HMR — false "API" matches like
  // /src/services/property/api/queries.ts (contains "/api/") caused 503 + broken lazy imports.
  if (isViteDevelopmentAsset(url)) {
    return;
  }
  
  // Route requests based on type
  if (isPropertyRequest(request)) {
    event.respondWith(handlePropertyRequest(request));
  } else if (isAnalyticsRequest(request)) {
    event.respondWith(handleAnalyticsRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Enhanced property request handling with offline support
async function handlePropertyRequest(request) {
  const networkType = getNetworkType();
  const strategy = networkType === 'slow' ? CACHE_STRATEGIES.CACHE_FIRST : CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  
  try {
    if (strategy === CACHE_STRATEGIES.CACHE_FIRST) {
      // Try cache first for slow networks
      const cachedResponse = await caches.match(request);
      if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATION.PROPERTIES)) {
        // Update in background
        updateCacheInBackground(request);
        return cachedResponse;
      }
    }
    
    // Try network
    const networkResponse = await fetch(request);
    // Pass through real HTTP errors (503, 429, …) so Supabase/PostgREST clients see the real status,
    // not synthetic "offline" JSON that breaks error handling.
    if (!networkResponse.ok) {
      return networkResponse;
    }

    // Cache successful response
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());

    // Store in offline cache only for the properties table (not other /rest/v1/* URLs)
    if (isRestV1PropertiesUrl(request.url)) {
      await storeOfflinePropertyData(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const now = Date.now();
    if (now - lastPropertiesFallbackLog > FALLBACK_LOG_INTERVAL) {
      console.debug('[SW] Network failed for properties, using cache/offline data');
      lastPropertiesFallbackLog = now;
    }
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline property data
    return getOfflinePropertyResponse(request);
  }
}

// Enhanced analytics request handling
async function handleAnalyticsRequest(request) {
  try {
    // Always try network first for analytics
    const networkResponse = await fetch(request);
    if (!networkResponse.ok) {
      return networkResponse;
    }
    const cache = await caches.open(API_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Fallback to cached analytics data
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATION.MARKET_DATA)) {
      return cachedResponse;
    }
    
    // Return offline analytics response
    return getOfflineAnalyticsResponse();
  }
}

// Enhanced image handling with progressive loading
async function handleImageRequest(request) {
  try {
    // Skip chrome-extension and other non-http requests
    if (request.url.startsWith('chrome-extension:') || request.url.startsWith('moz-extension:')) {
      return fetch(request);
    }
    
    // Try cache first for images
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache images for long duration
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Image fetch failed');
  } catch (error) {
    // Return placeholder image for offline
    return getPlaceholderImage();
  }
}

// Enhanced API request handling
async function handleAPIRequest(request) {
  const networkType = getNetworkType();
  const cacheDuration = networkType === 'slow' ? CACHE_DURATION.SLOW_NETWORK : CACHE_DURATION.FAST_NETWORK;
  
  try {
    // Try network with timeout for slow networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), networkType === 'slow' ? 10000 : 5000);
    
    const networkResponse = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!networkResponse.ok) {
      return networkResponse;
    }

    // Cache API response
    const cache = await caches.open(API_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const now = Date.now();
    if (now - lastApiFallbackLog > FALLBACK_LOG_INTERVAL) {
      console.debug('[SW] API request failed, trying cache');
      lastApiFallbackLog = now;
    }
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isExpired(cachedResponse, cacheDuration)) {
      return cachedResponse;
    }
    
    // Return offline API response
    return getOfflineAPIResponse(request);
  }
}

// Generic offline API response handler
async function getOfflineAPIResponse(request) {
  const url = new URL(request.url);
  
  // Check if it's a property-related request
  if (url.pathname.includes('/properties') || url.pathname.includes('/listings')) {
    return getOfflinePropertyResponse(request);
  }
  
  // Check if it's a bookings request
  if (url.pathname.includes('/bookings')) {
    return buildOfflineJsonResponse({
      endpoint: 'bookings',
      message: 'Booking data is unavailable while offline',
      data: []
    });
  }
  
  // Check if it's an analytics request
  if (url.pathname.includes('/analytics') || url.pathname.includes('/stats')) {
    return getOfflineAnalyticsResponse();
  }
  
  // For Supabase REST API requests, always return explicit offline response
  if (url.hostname.includes('supabase.co')) {
    return buildOfflineJsonResponse({
      endpoint: 'supabase',
      message: 'This operation requires an internet connection',
      data: null
    });
  }
  
  // Default offline response for other API requests
  return buildOfflineJsonResponse({
    endpoint: 'api',
    message: 'This data is not available offline',
    data: []
  });
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    // Skip chrome-extension and other non-http requests
    if (request.url.startsWith('chrome-extension:') || request.url.startsWith('moz-extension:')) {
      return fetch(request);
    }
    
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

// Enhanced navigation handling
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
    throw new Error('Navigation failed');
  } catch (error) {
    // Return cached page or offline page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Offline data management
async function storeOfflinePropertyData(request, response) {
  try {
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Only log once per URL to avoid spam (Supabase responses may not always be JSON)
      const skipLogCache = self.__skipLogCache || new Map();
      if (!skipLogCache.has(request.url)) {
        // Log once per URL, then suppress for 10 minutes
        console.debug('[SW] Skipping non-JSON response for offline storage:', request.url);
        skipLogCache.set(request.url, true);
        setTimeout(() => skipLogCache.delete(request.url), 10 * 60 * 1000); // 10 minutes
        self.__skipLogCache = skipLogCache;
      }
      return;
    }
    
    const data = await response.json();
    const db = await openOfflineDB();
    const tx = db.transaction([OFFLINE_PROPERTY_CACHE], 'readwrite');
    const store = tx.objectStore(OFFLINE_PROPERTY_CACHE);
    
    const isValidIdbKey = (id) => {
      const t = typeof id;
      return (t === 'string' && id.length > 0) || t === 'number';
    };

    if (Array.isArray(data)) {
      data.forEach((property, index) => {
        const rawId = property && property.id;
        const id = isValidIdbKey(rawId) ? rawId : `orphan-${Date.now()}-${index}`;
        if (!isValidIdbKey(rawId)) {
          console.warn('[SW] Skipping invalid property.id for offline cache; using synthetic key');
        }
        store.put({
          id,
          data: property,
          timestamp: Date.now(),
          url: request.url,
        });
      });
    } else {
      const rawId = data && data.id;
      const id = isValidIdbKey(rawId) ? rawId : `row-${Date.now()}`;
      store.put({
        id,
        data: data,
        timestamp: Date.now(),
        url: request.url,
      });
    }
  } catch (error) {
    console.error('[SW] Failed to store offline property data:', error);
  }
}

async function getOfflinePropertyResponse(request) {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction([OFFLINE_PROPERTY_CACHE], 'readonly');
    const store = tx.objectStore(OFFLINE_PROPERTY_CACHE);
    const properties = await store.getAll();
    
    // Filter recent properties (last 24 hours)
    const recentProperties = properties
      .filter(item => Date.now() - item.timestamp < 24 * 60 * 60 * 1000)
      .map(item => item.data);
    
    if (recentProperties.length > 0) {
      // Cached data is real but stale; keep status 200 and mark explicitly.
      return buildOfflineJsonResponse({
        endpoint: 'properties',
        message: 'Serving cached property data while offline',
        data: recentProperties,
        status: 200
      });
    }

    return buildOfflineJsonResponse({
      endpoint: 'properties',
      message: 'No cached property data is available offline',
      data: []
    });
  } catch (error) {
    return buildOfflineJsonResponse({
      endpoint: 'properties',
      message: 'Unable to read cached property data',
      data: []
    });
  }
}

async function getOfflineAnalyticsResponse() {
  const offlineData = {
    message: 'Offline mode - Limited analytics data',
    marketTrends: {
      lagos: { averagePrice: 45000000, change: '+2.3%' },
      abuja: { averagePrice: 35000000, change: '+1.8%' },
      portHarcourt: { averagePrice: 25000000, change: '+3.1%' }
    },
    lastUpdated: new Date().toISOString()
  };
  
  return buildOfflineJsonResponse({
    endpoint: 'analytics',
    message: 'Serving limited analytics data while offline',
    data: offlineData
  });
}

function buildOfflineJsonResponse({ endpoint, message, data, status = 503 }) {
  return new Response(
    JSON.stringify({
      offline: true,
      stale: status === 200,
      endpoint,
      message,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Fallback': 'true'
      }
    }
  );
}

// Network detection for Nigerian conditions
function getNetworkType() {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    
    if (effectiveType === '2g' || connection.downlink < 1) {
      return 'slow';
    } else if (effectiveType === '3g' || connection.downlink < 5) {
      return 'medium';
    } else {
      return 'fast';
    }
  }
  return 'unknown';
}

// Utility functions
/** Only the PostgREST `properties` table — avoids matching `property_tour_*`, `property_images`, etc. */
function isRestV1PropertiesUrl(url) {
  try {
    const { pathname } = new URL(url);
    return /^\/rest\/v1\/properties$/i.test(pathname);
  } catch {
    return false;
  }
}

function isPropertyRequest(request) {
  try {
    const p = new URL(request.url).pathname;
    return isRestV1PropertiesUrl(request.url) || p === '/api/properties' || p.startsWith('/api/properties/');
  } catch {
    return false;
  }
}

/** Must not use url.includes('analytics') — matches e.g. TenantAnalytics.tsx */
function isAnalyticsRequest(request) {
  try {
    const p = new URL(request.url).pathname;
    return p === '/api/analytics' || p.startsWith('/api/analytics/');
  } catch {
    return false;
  }
}

function isImageRequest(request) {
  return request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isAPIRequest(request) {
  try {
    const u = new URL(request.url);
    if (u.hostname.includes('supabase.co')) return true;
    // Same-origin backend only — not /src/.../api/foo.ts (Vite source tree)
    return u.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

function isViteDevelopmentAsset(url) {
  const p = url.pathname;
  // Vite module graph — never intercept (any host: LAN IP, ngrok, etc. all use /src/ + /@…).
  if (
    p.startsWith('/src/') ||
    p.startsWith('/@') ||
    p.startsWith('/node_modules/') ||
    p.includes('/.vite/')
  ) {
    return true;
  }
  const host = url.hostname;
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.local');
  return isLocal && (p.startsWith('/@fs/') || p.startsWith('/@vite/') || p.startsWith('/@react-refresh'));
}

function isStaticAsset(request) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(request.url);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;
  
  const responseTime = new Date(dateHeader).getTime();
  return Date.now() - responseTime > maxAge;
}

async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NigeriaHomesOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(OFFLINE_PROPERTY_CACHE)) {
        db.createObjectStore(OFFLINE_PROPERTY_CACHE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(OFFLINE_USER_DATA)) {
        db.createObjectStore(OFFLINE_USER_DATA, { keyPath: 'id' });
      }
    };
  });
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.includes('nigeria-homes') && !name.includes(CACHE_VERSION)
  );
  
  return Promise.all(oldCaches.map(name => caches.delete(name)));
}

async function initializeOfflineStorage() {
  await openOfflineDB();
  console.log('[SW] Offline storage initialized');
}

async function initializeBackgroundSync() {
  // Register background sync for offline actions
  console.log('[SW] Background sync initialized');
}

function getPlaceholderImage() {
  // Return a simple placeholder SVG
  const svg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Image Offline</text>
  </svg>`;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  console.log('[SW] Syncing offline data...');
  // Implement offline data sync logic
}

// Web Push (VAPID) — payload JSON: { title, body, url }
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let title = 'DamianixPro';
      let body = 'You have a new notification.';
      let url = '/';
      if (event.data) {
        try {
          const json = event.data.json();
          if (json.title) title = String(json.title);
          if (json.body) body = String(json.body);
          if (json.url) url = String(json.url);
        } catch {
          const text = event.data.text();
          if (text) body = text;
        }
      }
      await self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'damianixpro-push',
        data: { url },
        requireInteraction: false,
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const raw = data.url || '/';
  const targetUrl = raw.startsWith('http')
    ? raw
    : new URL(raw, self.location.origin).href;

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

console.log('[SW] Enhanced service worker loaded for DamianixPro PWA');
