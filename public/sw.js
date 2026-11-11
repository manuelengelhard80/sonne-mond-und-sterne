// Service Worker for Sonne, Mond und Sterne notifications & PWA
const CACHE_NAME = 'sonne-mond-v23';
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

// Simple persistence for SW state since globals are lost on termination
async function getStoredSchedule() {
  const cache = await caches.open('schedule-store');
  const response = await cache.match('morning-schedule');
  if (response) return response.json();
  return null;
}

async function setStoredSchedule(data) {
  const cache = await caches.open('schedule-store');
  await cache.put('morning-schedule', new Response(JSON.stringify(data)));
}

function triggerScheduledNotificationIfDue() {
  getStoredSchedule().then(scheduled => {
    if (!scheduled) return;
    const now = Date.now();
    if (now >= scheduled.targetTimestamp) {
      const { title, body, tag, icon, badge } = scheduled;
      setStoredSchedule(null);
      self.registration.showNotification(title, {
        body,
        tag: tag || 'daily-morning-affirmation',
        icon: icon || '/app-icon-full.png',
        badge: badge || '/badge-icon.png',
        vibrate: [200, 100, 200],
      });
    }
  });
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
    const schedule = {
      targetTimestamp: event.data.targetTimestamp,
      title: event.data.title,
      body: event.data.body,
      tag: event.data.tag,
      icon: event.data.icon,
      badge: event.data.badge,
    };
    event.waitUntil(setStoredSchedule(schedule));
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'check-morning-affirmation') {
    event.waitUntil(triggerScheduledNotificationIfDue());
  } else {
    triggerScheduledNotificationIfDue();
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'morning-affirmation-check') {
    event.waitUntil(triggerScheduledNotificationIfDue());
  }
});

// Fetch event listener required by Chromium Android to qualify for beforeinstallprompt
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Wake up check on every fetch
  triggerScheduledNotificationIfDue();

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

self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/app-icon-full.png',
        badge: data.badge || '/badge-icon.png',
        tag: data.tag || 'partner-push',
        data: {
          tab: data.navTab,
          url: data.navTab ? `/?tab=${data.navTab}` : '/'
        },
        vibrate: [200, 100, 200]
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (err) {
      console.warn('Push parse error:', err);
      event.waitUntil(
        self.registration.showNotification('Sonne, Mond und Sterne', {
          body: event.data.text(),
          icon: '/app-icon-full.png',
          badge: '/badge-icon.png'
        })
      );
    }
  }
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
