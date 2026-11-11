// Service Worker for Sonne, Mond und Sterne notifications & PWA
const CACHE_NAME = 'sonne-mond-v22';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon-full.png',
  '/badge-icon.png',
  '/lake-moon-icon.png',
  '/pwa-icon-192.png',
  '/pwa-icon-maskable-192.png',
  '/pwa-icon-512.png',
  '/pwa-icon-maskable-512.png',
  '/apple-touch-icon.png'
];

let scheduledMorningNotification = null;
let morningTimerId = null;

function triggerScheduledNotificationIfDue() {
  if (!scheduledMorningNotification) return;
  const now = Date.now();
  if (now >= scheduledMorningNotification.targetTimestamp) {
    const { title, body, tag, icon, badge } = scheduledMorningNotification;
    scheduledMorningNotification = null;
    if (morningTimerId) {
      clearTimeout(morningTimerId);
      morningTimerId = null;
    }
    self.registration.showNotification(title, {
      body,
      tag: tag || 'daily-morning-affirmation',
      icon: icon || '/app-icon-full.png?v=12',
      badge: badge || '/badge-icon.png?v=12',
      vibrate: [200, 100, 200],
    });
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial fallback:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      triggerScheduledNotificationIfDue();
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_MORNING_NOTIFICATION') {
    scheduledMorningNotification = {
      targetTimestamp: event.data.targetTimestamp,
      title: event.data.title,
      body: event.data.body,
      tag: event.data.tag,
      icon: event.data.icon,
      badge: event.data.badge,
    };
    if (morningTimerId) clearTimeout(morningTimerId);
    const msUntil = scheduledMorningNotification.targetTimestamp - Date.now();
    if (msUntil > 0 && msUntil < 2147483647) {
      morningTimerId = setTimeout(() => {
        triggerScheduledNotificationIfDue();
      }, msUntil);
    }
  }
});

self.addEventListener('sync', (event) => {
  triggerScheduledNotificationIfDue();
});

self.addEventListener('periodicsync', (event) => {
  triggerScheduledNotificationIfDue();
});

// Fetch event listener required by Chromium Android to qualify for beforeinstallprompt
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // IMPORTANT: Never intercept media files or Range requests in Service Worker
  // Browsers require direct HTTP 206 Range streaming for audio without Service Worker interference
  const url = new URL(event.request.url);
  if (
    event.request.headers.has('range') ||
    url.pathname.match(/\.(mp3|wav|ogg|m4a|aac|mp4|webm)$/i)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetTab = (event.notification.data && event.notification.data.tab) ? event.notification.data.tab : null;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (targetTab && 'postMessage' in client) {
            client.postMessage({ type: 'NAVIGATE_TAB', tab: targetTab });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        const targetUrl = targetTab ? `/?tab=${targetTab}` : '/';
        return clients.openWindow(targetUrl);
      }
    })
  );
});
