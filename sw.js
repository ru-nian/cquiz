const CACHE = 'cquiz-980fece4d5';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 页面导航：先联网，拿到最新版；断网才回落到缓存
  // （免得改了题库后，旧页面被缓存一直挡住）
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 其他静态资源：缓存优先
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return resp;
    }))
  );
});
