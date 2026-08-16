/* 300 Days With You — service worker (Section 70) */
const CACHE = 'days300-v1';
const CORE = [
  './', './index.html', './css/main.css',
  './js/data.js', './js/kakaoparse.js', './js/firebase.js', './js/store.js', './js/router.js', './js/app.js',
  './js/views/home.js', './js/views/ourdays.js', './js/views/diary.js', './js/views/memory.js',
  './js/views/ourstory.js', './js/views/album.js', './js/views/special.js', './js/views/future.js',
  './js/views/notifications.js', './js/views/search.js', './manifest.webmanifest',
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return; // let CDN/Firebase requests pass through untouched
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(e.request, copy));
      return res;
    }).catch(()=> cached))
  );
});
