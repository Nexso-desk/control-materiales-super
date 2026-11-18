const scope = self.registration.scope;
const prefix = 'control-materiales-super:' + scope + ':';
const version = prefix + '7';
const home = new URL('./', scope).href;
const files = ['./', './index.html', './manifest.webmanifest', './instalar.js', './base-config.js', './base.js', './icons/icon-192.png', './icons/icon-512.png'];
const urls = new Set(files.map(file => new URL(file, scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(version).then(cache =>
    cache.addAll(files.map(file => new Request(new URL(file, scope), {cache:'reload'})))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(prefix) && key !== version)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.href.startsWith(scope)) return;
  const path = url.origin + url.pathname;
  if (request.mode === 'navigate' && (path === home || path === home + 'index.html')) {
    event.respondWith(fetch(request).catch(async () => (await caches.open(version)).match(home)));
  } else if (urls.has(url.href)) {
    event.respondWith(caches.open(version).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
