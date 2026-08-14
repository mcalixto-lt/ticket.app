const CACHE = 'ticket-app-v104';
const CORE = [
  '/',
  '/index.html',
  '/app.js?v=104',
  '/src/styles.css?v=104',
  '/src/mobile-auth.css?v=104',
  '/src/settings-capture-v103.css?v=104',
  '/src/ticket-enhancements-v103.js?v=104',
  '/src/ticket-fixes-v104.css?v=104',
  '/src/ticket-fixes-v104.js?v=104',
  '/public/manifest.webmanifest',
  '/public/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
        return response;
      })
      .catch(async () => (await caches.match(event.request)) || caches.match('/index.html'))
  );
});
