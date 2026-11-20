// Penyimpan offline sederhana: aplikasi, teks Al-Qur'an, dan dzikir tetap bisa dibuka tanpa sinyal.
const C='hafalan-juz30-v2';
const CORE=['./','index.html','juz30.json','dzikir.json','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,u=new URL(req.url);
  if(req.method!=='GET'||u.origin!==location.origin||u.pathname.endsWith('.mp3'))return;
  if(req.mode==='navigate'||u.pathname.endsWith('.json')){
    // utamakan versi terbaru dari internet, pakai simpanan kalau offline
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(req,cp));return r}).catch(()=>caches.match(req).then(r=>r||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(req,cp));return res})));
});
