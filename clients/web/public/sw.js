// Service Worker for BeQ - Offline-first caching strategy

// Cache version - update this when deploying new versions to force cache invalidation
const CACHE_VERSION = 'beq-v2';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const API_CACHE_NAME = `${CACHE_VERSION}-api`;

// Resources to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/site.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.svg',
  '/beq-logo.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/bricks',
  '/api/quantas',
  '/api/calendar',
  '/api/chat',
  '/api/dashboard',
  '/api/schedule',
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static resources
  if (isStaticResource(url)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default network-first strategy for other requests
  event.respondWith(
    fetch(request)
      .catch(() => {
        // If network fails, try cache
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/beq-logo.png',
      badge: '/beq-logo.png',
      vibrate: [100, 50, 100],
      data: data.data,
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

function isApiRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isStaticResource(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.startsWith('/_next/');
}

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    // Network-first strategy for API calls
    const networkResponse = await fetch(request.clone());

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);

    // Try to get from cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are offline. This data may be outdated.',
        offline: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Cache-first strategy for static resources
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if we should update in background
      fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse);
        }
      }).catch(() => {
        // Silently fail background updates
      });

      return cachedResponse;
    }

    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;

  } catch (error) {
    console.log('Failed to handle static request:', request.url, error);
    return new Response('Offline', { status: 503 });
  }
}

async function syncOfflineActions() {
  try {
    // Get stored offline actions
    const offlineActions = await getStoredOfflineActions();

    if (offlineActions.length === 0) {
      return;
    }

    console.log(`Syncing ${offlineActions.length} offline actions`);

    // Process each action
    const results = await Promise.allSettled(
      offlineActions.map(async (action) => {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });

          if (response.ok) {
            return { action, success: true };
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          return { action, success: false, error: error.message };
        }
      })
    );

    // Remove successfully synced actions
    const successfulActions = results
      .filter(result => result.status === 'fulfilled' && result.value.success)
      .map(result => result.value.action);

    if (successfulActions.length > 0) {
      await removeSyncedActions(successfulActions);
      console.log(`Successfully synced ${successfulActions.length} actions`);
    }

    // Handle failed actions (could implement retry logic here)
    const failedActions = results.filter(result =>
      result.status === 'rejected' ||
      (result.status === 'fulfilled' && !result.value.success)
    );

    if (failedActions.length > 0) {
      console.log(`${failedActions.length} actions failed to sync`);
    }

  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for offline action storage
async function getStoredOfflineActions() {
  // In a real implementation, you'd use IndexedDB or similar
  // For now, return empty array
  return [];
}

async function removeSyncedActions(actions) {
  // Implementation would remove from IndexedDB
  console.log('Would remove synced actions:', actions.length);
}
