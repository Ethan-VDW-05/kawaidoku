// Kawaidoku : permet au jeu de s'ouvrir hors connexion.
// Le jeu (index.html) est toujours rechargé depuis Internet quand c'est possible,
// pour que les mises à jour arrivent tout de suite.
const CACHE = 'kawaidoku-v2';
const FILES = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname === 'api.github.com' || url.pathname.endsWith('messages.json')) return;
  // Polices Google : en cache pour toujours
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })));
    return;
  }
  // Le reste : Internet d'abord, sinon la copie en cache
  e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});

// Notifications envoyées par le robot GitHub
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (x) { d = { title: 'Kawaidoku', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Kawaidoku', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if ('focus' in c) return c.focus();
    return clients.openWindow('./');
  }));
});
