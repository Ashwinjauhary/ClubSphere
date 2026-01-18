// Service Worker for ClubSphere PWA
const CACHE_NAME = 'clubsphere-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/main.tsx',
    '/src/index.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Verify scheme is http or https
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Double check scheme before caching to be paranoid
                    if (!event.request.url.startsWith('http')) return response;

                    try {
                        // Clone the response
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // schemes like chrome-extension:// will throw here if they slip through
                                if (event.request.url.startsWith('http')) {
                                    cache.put(event.request, responseToCache);
                                }
                            });
                    } catch (err) {
                        // Ignore caching errors for unsupported schemes
                    }

                    return response;
                });
            })
    );
});
