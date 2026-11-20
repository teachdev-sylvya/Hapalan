// Penyimpan offline sederhana + penerima stiker yang dibagikan dari aplikasi lain.
const C='hafalan-juz30-v10';
const CORE=['./','index.html','juz30.json','dzikir.json','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!=='share-inbox').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,u=new URL(req.url);
  if(req.method==='POST'&&u.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{const fd=await req.formData();const files=fd.getAll('media');const c=await caches.open('share-inbox');let i=0;
        for(const f of files){if(f&&f.size)await c.put('./__share/'+Date.now()+'-'+(i++),new Response(f,{headers:{'content-type':f.type||'image/webp'}}))}}catch(err){}
      return Response.redirect('./?shared=1',303);
    })());
    return;
  }
  if(req.method!=='GET'||u.origin!==location.origin||u.pathname.endsWith('.mp3'))return;
  if(req.mode==='navigate'||u.pathname.endsWith('.json')){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(req,cp));return r}).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(req,cp));return res})));
});
