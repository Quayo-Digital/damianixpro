// Enhanced Service Worker for Nigeria Homes Platform PWA
// Optimized for Nigerian mobile networks and app-like experience

const CACHE_VERSION = '2.0.0';
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
  // Core app shell files
  '/static/js/main.js',
  '/static/css/main.css',
  // Critical pages
  '/properties',
  '/dashboard',
  '/analytics'
];

// Offline-first property data structure
const OFFLINE_PROPERTY_CACHE = 'offline-properties';
const OFFLINE_USER_DATA = 'offline-user-data';
const OFFLINE_SEARCH_CACHE = 'offline-searches';

// Install event - Cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Enhanced service worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
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
    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      
      // Store in offline cache for property data
      if (request.url.includes('/properties')) {
        await storeOfflinePropertyData(request, networkResponse.clone());
      }
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed, trying cache for properties');
    
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
    if (networkResponse.ok) {
      // Cache for short duration
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
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
    
    if (networkResponse.ok) {
      // Cache API response
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('API response not ok');
  } catch (error) {
    console.log('[SW] API request failed, trying cache');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isExpired(cachedResponse, cacheDuration)) {
      return cachedResponse;
    }
    
    // Return offline API response
    return getOfflineAPIResponse(request);
  }
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
      console.log('[SW] Skipping non-JSON response for offline storage:', request.url);
      return;
    }
    
    const data = await response.json();
    const db = await openOfflineDB();
    const tx = db.transaction([OFFLINE_PROPERTY_CACHE], 'readwrite');
    const store = tx.objectStore(OFFLINE_PROPERTY_CACHE);
    
    if (Array.isArray(data)) {
      // Store multiple properties
      data.forEach(property => {
        store.put({
          id: property.id,
          data: property,
          timestamp: Date.now(),
          url: request.url
        });
      });
    } else {
      // Store single property
      store.put({
        id: data.id || Date.now(),
        data: data,
        timestamp: Date.now(),
        url: request.url
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
    
    return new Response(JSON.stringify(recentProperties), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
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
  
  return new Response(JSON.stringify(offlineData), {
    headers: { 'Content-Type': 'application/json' }
  });
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
function isPropertyRequest(request) {
  return request.url.includes('/properties') || request.url.includes('/api/properties');
}

function isAnalyticsRequest(request) {
  return request.url.includes('/analytics') || request.url.includes('/api/analytics');
}

function isImageRequest(request) {
  return request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isAPIRequest(request) {
  return request.url.includes('/api/') || request.url.includes('supabase.co');
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

// Push notifications for property alerts
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New property alert!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'property-alert',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Property'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Nigeria Homes', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/properties')
    );
  }
});

console.log('[SW] Enhanced service worker loaded for Nigeria Homes PWA');
