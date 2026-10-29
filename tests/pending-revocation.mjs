import {field,fill} from './profile-controls.mjs'
import assert from 'node:assert/strict'
const {chromium}=await import(process.env.BROWSER_CORE_PATH || '/home/taymur/.hermes/hermes-agent/node_modules/playwright-core/index.mjs')
const browser=await chromium.launch({executablePath:'/usr/sbin/chromium',headless:true,args:['--no-sandbox']})
const healthy={name:'Synthetic',sex:'female',age:30,heightCm:170,targetWeightKg:65,currentWeightKg:75,units:'metric',bankedCalories:0,cumulativeBankedCalories:0,safetyAcknowledged:true,safetyReviewVersion:1}
async function setup(){
 const context=await browser.newContext();const page=await context.newPage()
 await page.goto((process.env.RACE_BASE || 'http://127.0.0.1:4192')+'/app')
 await page.evaluate(async p=>{const db=await import('/src/db.ts');await db.getProfile();const r=indexedDB.open('fastdiet',2);await new Promise(ok=>r.onsuccess=ok);const tx=r.result.transaction(['profile','weights','meals','workouts'],'readwrite');tx.objectStore('profile').put(p,'profile');tx.objectStore('weights').put({id:'synthetic-weight',kg:75,date:'2026-01-01'});tx.objectStore('meals').put({id:'synthetic-meal',calories:500,loggedAt:'2026-01-01'});tx.objectStore('workouts').put({id:'synthetic-workout',caloriesBurned:20,loggedAt:'2026-01-01'});await new Promise(ok=>tx.oncomplete=ok);r.result.close()},healthy)
 await page.reload();await page.getByRole('button',{name:'Profile',exact:true}).click()
 return {context,page}
}
async function history(page){return page.evaluate(async()=>{const db=await import('/src/db.ts');return JSON.stringify([await db.getWeights(),await db.getMeals(),await db.getWorkouts()])})}
async function lock(page){await page.evaluate(async()=>{const r=indexedDB.open('fastdiet',2);await new Promise(ok=>r.onsuccess=ok);window.hold=true;window.released=false;const tx=r.result.transaction('profile','readwrite');const store=tx.objectStore('profile');function spin(){store.get('profile').onsuccess=()=>{if(window.hold)spin()}}spin();tx.oncomplete=()=>{window.released=true;r.result.close()}})}
async function release(page){await page.evaluate(()=>{window.hold=false});await page.waitForFunction(()=>window.released)}
async function failure(page,enabled){await page.evaluate(enabled=>{window.failNegative=enabled;if(window.installedFailure)return;window.installedFailure=true;const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='profile' && (window.failAll || (window.failNegative && args[0]?.safetyAcknowledged===false)))throw new DOMException('Synthetic persistence failure','QuotaExceededError');return original.apply(this,args)}},enabled)}
let count=0
try{
 for(const fail of (process.env.RACE_NEGATIVE_ONLY ? [true] : [false,true])){
  const {context,page}=await setup();const before=await history(page)
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Profile',exact:true}).click()
  await lock(page);await fill(page,'Name','Older pending save');await page.getByRole('button',{name:'Save and continue',exact:true}).click()
  assert.equal(await page.getByRole('button',{name:'Cancel',exact:true}).isDisabled(),true)
  assert.equal(await page.getByRole('checkbox').isDisabled(),true)
  assert.equal(await page.getByLabel('Name',{exact:true}).isDisabled(),true)
  assert.equal(await page.getByRole('button',{name:'Close',exact:true}).count(),0,'pending editor cannot be dismissed')
  const backDisabled=await page.getByRole('button',{name:'Back',exact:true}).isDisabled()
  // Invoke the real React Back handler even when disabled: exercise the hook race.
  await page.getByRole('button',{name:'Back',exact:true}).evaluate(button=>{const key=Object.keys(button).find(k=>k.startsWith('__reactProps$'));button[key].onClick()})
  await page.getByRole('button',{name:'Profile',exact:true}).click();await failure(page,fail);await page.getByRole('checkbox').uncheck();await release(page)
  await page.waitForFunction(()=>document.body.innerText.includes('Log meal') || document.querySelector('[aria-label="Save and continue"]'))
  assert.equal(await page.getByRole('button',{name:'Log meal',exact:true}).count(),0,'older save must not restore dashboard')
  assert.equal(backDisabled,true,'Back must be disabled while saving')
  if(fail)await page.getByRole('alert').waitFor()
  assert.equal(await page.getByRole('checkbox').isChecked(),false)
  assert.equal(await (await field(page,'Name')).inputValue(),'Synthetic','superseded completion must preserve latest draft')
  assert.equal(await page.evaluate(async()=> (await (await import('/src/db.ts')).getProfile()).safetyAcknowledged),fail,'failed negative persistence must not be reported as durable')
  assert.equal(await history(page),before)
  await fill(page,'Name','Latest draft');await page.getByRole('checkbox').check()
  await page.evaluate(()=>{window.failAll=true});await page.getByRole('button',{name:'Save and continue',exact:true}).click();await page.getByRole('alert').filter({hasText:'Synthetic persistence failure'}).waitFor()
  assert.equal(await page.getByRole('button',{name:'Log meal',exact:true}).count(),0)
  await page.evaluate(()=>{window.failAll=false;window.failNegative=false});await page.getByRole('button',{name:'Save and continue',exact:true}).click();await page.getByRole('button',{name:'Log meal',exact:true}).waitFor();assert.equal(await history(page),before)
  await context.close();count++
 }
 // Mount the actual hook to exercise background callbacks and overlapping reaffirmation.
 for(const explicit of [false,true]){
  const {context,page}=await setup();const before=await history(page)
  await page.evaluate(async()=>{const storeSource=await (await fetch('/src/store.ts')).text();const mainSource=await (await fetch('/src/main.tsx')).text();const reactPath=storeSource.match(/from ["']([^"']*\/react\.js[^"']*)["']/)[1];const clientPath=mainSource.match(/from ["']([^"']*react-dom_client\.js[^"']*)["']/)[1];const React=await import(reactPath);const client=await import(clientPath);const createRoot=client.createRoot || client.default.createRoot;const {useProfile}=await import('/src/store.ts');const el=document.createElement('div');document.body.append(el);function Probe(){window.hook=useProfile();return null}createRoot(el).render((React.createElement || React.default.createElement)(Probe))})
  await page.waitForFunction(()=>window.hook?.profile)
  await page.evaluate(async()=>{window.stale={...window.hook.profile};await window.hook.revoke()})
  await lock(page)
  await page.evaluate(explicit=>{window.outcome='pending';window.hook.save(window.stale,explicit ? {reaffirm:true}:undefined).then(()=>window.outcome='saved',()=>window.outcome='rejected')},explicit)
  if(explicit)await page.evaluate(()=>{window.revoked=window.hook.revoke().catch(()=>{})})
  await release(page);await page.waitForFunction(()=>window.outcome!=='pending');await page.evaluate(()=>window.revoked)
  assert.equal(await page.evaluate(()=>window.outcome),'rejected')
  assert.equal(await page.evaluate(()=>window.hook.profile.safetyAcknowledged),false)
  assert.equal(await page.evaluate(async()=> (await (await import('/src/db.ts')).getProfile()).safetyAcknowledged),false)
  assert.equal(await history(page),before);await context.close();count++
 }
 console.log(`Pending revocation IDB-lock scenarios passed: ${count}`)
}finally{await browser.close()}
