import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {resolve,extname} from 'node:path'
const {chromium} = await import(process.env.BROWSER_CORE_PATH || '/home/taymur/.hermes/hermes-agent/node_modules/playwright-core/index.mjs')
import assert from 'node:assert/strict'
let legacy=true
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname
 res.setHeader('Cache-Control','no-store')
 if(path==='/sw.js' && legacy){res.setHeader('Content-Type','application/javascript');res.end("self.addEventListener('install',e=>e.waitUntil(caches.open('legacy-fastdiet-build').then(c=>c.put('/app',new Response('<html><body>Legacy cached build</body></html>',{headers:{'Content-Type':'text/html'}}))).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(caches.match('/app'))});");return}
 try {const file=resolve('dist', path==='/' || path==='/app'?'index.html':'.'+path);if(!file.startsWith(resolve('dist')+'/'))throw Error();res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(await readFile(file))}catch{res.statusCode=404;res.end()}
})
await new Promise(r=>server.listen(4191,'127.0.0.1',r))
const browser=await chromium.launch({executablePath:'/usr/sbin/chromium',headless:true,args:['--no-sandbox']})
try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4191/app')
 await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready})
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller))
 await page.evaluate(async()=>{const r=indexedDB.open('fastdiet',2);await new Promise((resolve,reject)=>{r.onsuccess=resolve;r.onerror=reject});const db=r.result;const tx=db.transaction('meals','readwrite');tx.objectStore('meals').put({id:'synthetic-upgrade',name:'preserve',calories:123,kind:'meal',loggedAt:'2026-01-01'});await new Promise(r=>tx.oncomplete=r);db.close()})
 await page.reload();await page.getByText('Legacy cached build').waitFor()
 legacy=false
 await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();if(reg.installing)await new Promise(r=>{reg.installing.addEventListener('statechange',()=>{if(!reg.installing)r()})})})
 await page.reload();await page.getByRole('heading',{name:'About me'}).waitFor()
 assert.equal(await page.evaluate(async()=>{const r=indexedDB.open('fastdiet',2);await new Promise(r2=>r.onsuccess=r2);const db=r.result;const req=db.transaction('meals').objectStore('meals').get('synthetic-upgrade');return await new Promise(r2=>req.onsuccess=()=>r2(req.result.calories))}),123)
 assert.ok(await page.evaluate(async()=> (await caches.keys()).some(k=>k.includes('precache'))))
 console.log('Production service-worker upgrade: passed; IndexedDB record preserved')
}finally{await browser.close();await new Promise(r=>server.close(r))}
