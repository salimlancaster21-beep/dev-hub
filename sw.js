const CACHE = 'devhub-v2';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

let scheduledTimer = null;

function scheduleNext(title, body, delayMs) {
  if (scheduledTimer) clearTimeout(scheduledTimer);
  scheduledTimer = setTimeout(async () => {
    await self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'daily-lesson',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: './' }
    });
    scheduleNext(title, body, 24 * 60 * 60 * 1000);
  }, delayMs);
}

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(
    data.title || "Time for today's lesson",
    { body: data.body || 'Your development session is ready.', icon: './icon-192.png', badge: './icon-192.png', tag: 'daily-lesson', renotify: true, vibrate: [200, 100, 200], data: { url: './' } }
  ));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.registration.scope) && 'focus' in c) return c.focus();
      }
      return clients.openWindow('./');
    })
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNext(e.data.title, e.data.body, e.data.delay);
  }
});
