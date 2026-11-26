// -----------------------------------------------------------------------------
// EAP Online Compiler — Offline PWA Service Worker (Cache-First with Network Update)
// -----------------------------------------------------------------------------

const CACHE_NAME = 'eap-compiler-offline-v2';

const PRECACHE_URLS = [
  './',
  './index.html',
  './editor.html',
  './pli11.html',
  './pli11-classes.html',
  './manifest.json',
  './favicon.svg',
  './style.css',
  './landing.css',
  './pli11.css',
  './common.js',
  './docx-exporter.js',
  './diagram-viewport.js',
  './mermaid-visual-editor.js',
  './eap-mode.js',
  './examples.js',
  './core.v6.js',
  './app.v6.js',
  './pli11-mode.js',
  './pli11-examples.js',
  './pli11-core.js',
  './pli11-renderer.js',
  './pli11-app.js',
  './pli11-classes-mode.js',
  './pli11-classes-examples.js',
  './pli11-classes-core.js',
  './pli11-classes-renderer.js',
  './pli11-classes-app.js',
  './vendor/lz-string.min.js',
  './vendor/mermaid.min.js',
  './vendor/codemirror/codemirror.min.css',
  './vendor/codemirror/dracula.min.css',
  './vendor/codemirror/show-hint.min.css',
  './vendor/codemirror/codemirror.min.js',
  './vendor/codemirror/closebrackets.min.js',
  './vendor/codemirror/matchbrackets.min.js',
  './vendor/codemirror/show-hint.min.js',
  './vendor/codemirror/active-line.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
