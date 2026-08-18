const CACHE = 'ticket-app-v128';
const CORE = [
  '/', '/index.html', '/app.js?v=128', '/src/styles.css?v=128', '/src/mobile-auth.css?v=128',
  '/src/settings-capture-v103.css?v=128', '/src/ticket-enhancements-v103.js?v=128', '/src/ticket-fixes-v104.css?v=128', '/src/ticket-fixes-v104.js?v=128',
  '/src/ticket-enhancements-v105.css?v=128', '/src/ticket-enhancements-v105.js?v=128', '/src/ticket-hotfix-v105.js?v=128',
  '/src/ticket-enhancements-v106.css?v=128', '/src/ticket-enhancements-v106.js?v=128', '/src/ticket-enhancements-v107.css?v=128', '/src/ticket-enhancements-v107.js?v=128',
  '/src/ticket-ai-v108.js?v=128', '/src/ticket-ai-v109.js?v=128', '/src/ticket-ai-v110.js?v=128', '/src/ticket-enhancements-v111.css?v=128', '/src/ticket-enhancements-v111.js?v=128', '/src/ticket-ai-v111.js?v=128',
  '/src/ticket-enhancements-v112.css?v=128', '/src/ticket-enhancements-v112.js?v=128', '/src/ticket-enhancements-v113.css?v=128', '/src/ticket-enhancements-v113.js?v=128',
  '/src/ticket-enhancements-v114.css?v=128', '/src/ticket-enhancements-v114.js?v=128', '/src/ticket-enhancements-v115.css?v=128', '/src/ticket-enhancements-v115.js?v=128',
  '/src/ticket-enhancements-v116.css?v=128', '/src/ticket-enhancements-v116.js?v=128',
 
  '/src/ticket-enhancements-v122.css?v=128', '/src/ticket-enhancements-v122.js?v=128',
  '/src/ticket-settings-v130.css?v=128', '/src/ticket-settings-v130.js?v=128',
  '/version.json', '/public/version.json', '/public/manifest.webmanifest?v=128', '/public/app-icon-v113.svg?v=128', '/public/app-icon-maskable-v113.svg?v=128', '/public/favicon.svg'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response;}).catch(async()=>await caches.match(event.request)||caches.match('/index.html')));});
