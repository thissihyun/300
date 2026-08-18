/* 300 Days With You — app cache */
const CACHE = 'days300-production-13';
const CORE = [
  './', './index.html', './css/v3.css', './css/v3-full.css', './css/v3-album.css', './css/v3-polish.css', './css/v3-production.css', './css/v3-userfix.css', './css/v3-guard.css', './css/v3-fix2.css', './css/v3-hotfix3.css', './css/v3-fix4.css',
  './js/v3.js', './js/v3-full.js', './js/v3-album.js', './js/v3-photo-legacy.js', './js/v3-polish.js', './js/v3-production.js', './js/v3-userfix.js', './js/v3-fix2.js', './js/v3-hotfix3.js', './js/v3-fix4.js', './manifest.webmanifest',
  '../v2/css/main.css', '../v2/js/data.js','../v2/js/fullchat.js','../v2/js/anim.js','../v2/js/kakaoparse.js','../v2/js/firebase.js','../v2/js/store.js','../v2/js/router.js','../v2/js/app.js',
  '../v2/js/views/home.js','../v2/js/views/ourdays.js','../v2/js/views/diary.js','../v2/js/views/memory.js','../v2/js/views/ourstory.js','../v2/js/views/album.js','../v2/js/views/special.js','../v2/js/views/future.js','../v2/js/views/notifications.js','../v2/js/views/search.js'
];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{ if(e.request.method!=='GET') return; const url=new URL(e.request.url); if(url.origin!==location.origin) return; e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return res; }).catch(()=>cached))); });