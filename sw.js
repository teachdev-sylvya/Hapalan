// Penyimpan offline sederhana + penerima stiker yang dibagikan dari aplikasi lain.
const C='hafalan-juz30-v23';
const AC='jh-audio-v1';
const CORE=['./','index.html','juz30.json','dzikir.json','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!==AC&&k!=='share-inbox').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const inflight=new Set();
async function cacheFull(key){if(inflight.has(key))return;inflight.add(key);try{const c=await caches.open(AC);if(await c.match(key))return;const net=await fetch(key,{credentials:'same-origin'});if(net.ok&&net.status===200)await c.put(key,net)}catch(e){}finally{inflight.delete(key)}}
async function audioResp(req,ev){
  const u=new URL(req.url);u.search='';const key=u.href;
  const c=await caches.open(AC);
  let r=await c.match(key);
  if(!r){
    // belum tersimpan: putar langsung dari internet (streaming), simpan utuh di belakang layar
    ev.waitUntil(cacheFull(key));
    return fetch(req);
  }
  const range=req.headers.get('range');
  if(!range)return r;
  const buf=await r.arrayBuffer(),len=buf.byteLength;
  const m=/bytes=(\d*)-(\d*)/.exec(range);
  let s=0,e=len-1;
  if(m){if(m[1]===''&&m[2]!==''){s=Math.max(0,len-(+m[2]))}else{s=+m[1]||0;if(m[2]!=='')e=Math.min(+m[2],len-1)}}
  if(s>=len)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+len}});
  return new Response(buf.slice(s,e+1),{status:206,headers:{'Content-Type':r.headers.get('Content-Type')||'audio/mpeg','Content-Range':'bytes '+s+'-'+e+'/'+len,'Content-Length':String(e-s+1),'Accept-Ranges':'bytes'}});
}
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
  if(req.method!=='GET'||u.origin!==location.origin)return;
  if(u.pathname.endsWith('.mp3')){if(u.searchParams.has('dl'))return;e.respondWith(audioResp(req,e));return}
  if(req.mode==='navigate'||u.pathname.endsWith('.json')){
    e.respondWith(fetch(req.mode==='navigate'?req.url:req,{cache:'no-cache',credentials:'same-origin'}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(req.mode==='navigate'?'index.html':req,cp));return r}).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(req,cp));return res})));
});
