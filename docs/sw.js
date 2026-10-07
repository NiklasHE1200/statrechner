/* Offline-Unterstützung: immer zuerst online laden, sonst aus dem Zwischenspeicher. */
const CACHE = 'statrechner-v2';
const CORE = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'vendor/katex/katex.min.css', 'vendor/katex/katex.min.js',
  'js/config.js', 'js/stats.js', 'js/format.js', 'js/charts.js', 'js/calculator.js', 'js/auth.js', 'js/app.js',
  'js/tools/registry.js', 'js/tools/descriptive.js', 'js/tools/regression.js', 'js/tools/normal.js',
  'js/tools/inference.js', 'js/tools/finance.js', 'js/tools/project-map.js', 'js/projects.js', 'vendor/fflate.min.js', 'guide/pages.js', 'icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
