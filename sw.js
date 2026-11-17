const CACHE="studysprint-shell-v35-v14";
const ASSETS=["./","./index.html","./styles.css?v=14","./design-v2.css?v=14","./design-v3.css?v=14","./config.js?v=14","./study-core.js?v=14","./app.js?v=14","./maxi-plus.js?v=14","./enhancements.js?v=14","./manifest.webmanifest","./icon.svg","./icon-maskable.svg","./account.js?v=14","./terms.html","./privacy.html","./refund.html","./contact.html","./pricing.html" ,"./visual-upgrade.css?v=14","./visual-upgrade.js?v=14"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||new URL(r.url).origin!==self.location.origin)return;
  const fresh=r.mode==="navigate"||["script","style"].includes(r.destination);
  e.respondWith((fresh?fetch(r).then(res=>{
    const copy=res.clone(); caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{}); return res;
  }):caches.match(r).then(cached=>cached||fetch(r).then(res=>{
    const copy=res.clone(); caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{}); return res;
  }))).catch(()=>caches.match(r).then(c=>c||caches.match("./index.html")));
});
