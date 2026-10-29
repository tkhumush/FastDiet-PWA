const {chromium} = await import(process.env.BROWSER_CORE_PATH || '/home/taymur/.hermes/hermes-agent/node_modules/playwright-core/index.mjs')
import assert from 'node:assert/strict'
const browser = await chromium.launch({executablePath:'/usr/sbin/chromium',headless:true,args:['--no-sandbox']})
const base = 'http://127.0.0.1:4190'
const artifacts = '/home/taymur/.hermes/cache/scratch/fastdiet-safety-artifacts'
let count = 0
const healthy = {name:'Synthetic',sex:'female',age:30,heightCm:170,targetWeightKg:65,currentWeightKg:75,units:'metric',bankedCalories:0,cumulativeBankedCalories:0,lastActivityBankDate:null,lastWeeklyCheckInDate:null,safetyAcknowledged:true,safetyReviewVersion:1}
async function setup(profile) {
 const context=await browser.newContext({viewport:{width:390,height:844}})
 const page=await context.newPage()
 const errors=[];page.on('pageerror',error=>errors.push(error.message));context.on('close',()=>assert.deepEqual(errors,[]))
 await page.goto(base+'/app')
 await page.evaluate(async p => {
  const db = await import('/src/db.ts')
  await db.getProfile()
  const request=indexedDB.open('fastdiet',2)
  await new Promise((resolve,reject)=>{request.onsuccess=resolve;request.onerror=reject})
  const raw=request.result
  const tx=raw.transaction(['profile','meals','weights','workouts'],'readwrite')
  if(p) tx.objectStore('profile').put(p,'profile')
  tx.objectStore('meals').put({id:'preserved-meal',loggedAt:'2026-01-01T00:00:00Z',calories:500,name:'Synthetic',kind:'meal'})
  tx.objectStore('weights').put({id:'preserved-weight',date:'2026-01-01T00:00:00Z',kg:p?.currentWeightKg === 30 ? 30 : 75})
  tx.objectStore('workouts').put({id:'preserved-workout',loggedAt:'2026-01-01T00:00:00Z',caloriesBurned:10,workoutTypeId:'walk',durationMinutes:5,label:'Synthetic',emoji:''})
  await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=reject});raw.close()
 },profile)
 return {context,page}
}
async function snapshot(page) {return page.evaluate(async()=>{const db=await import('/src/db.ts');return JSON.stringify([await db.getProfile(),await db.getMeals(),await db.getWeights(),await db.getWorkouts()])})}
try {
 for (const patch of [{age:15,heightCm:150,targetWeightKg:30},{targetWeightKg:30},{currentWeightKg:30},{currentWeightKg:undefined,safetyAcknowledged:undefined},{currentWeightKg:undefined},{safetyAcknowledged:undefined},{safetyAcknowledged:false},{age:'30'},{age:30.5},{sex:'unsupported'},{units:'unsupported'},{heightCm:null},{safetyReviewVersion:99}]) {
  const p={...healthy,...patch}; const {context,page}=await setup(p)
  // A missing current weight must require review even with historical logs.
  const before=await snapshot(page)
  await page.reload(); await page.getByRole('heading',{name:'Profile safety review'}).waitFor()
  assert.equal(await page.getByText('1125').count(),0)
  assert.equal(await page.locator('body').innerText().then(s=>s.includes('cal/day estimated resting')),false)
  const rejected=await page.evaluate(async p=>{const db=await import('/src/db.ts');try {await db.saveProfile(p);return false}catch{return true}},p)
  assert.equal(rejected,true)
  assert.equal(await snapshot(page),before)
  if(p.age===15) await page.screenshot({path:artifacts+'/existing-review.png',fullPage:true})
  await context.close(); count++
 }
 for (const units of ['metric','imperial']) {
  const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(base+'/app')
  await page.getByLabel('Units',{exact:true}).selectOption(units)
  await page.getByLabel('Actual current weight').fill(units==='metric'?'75':'165')
  await page.getByRole('checkbox').check()
  if(units==='metric') await page.screenshot({path:artifacts+'/onboarding-policy.png',fullPage:true})
  await page.getByRole('button',{name:'Save and continue'}).click()
  await page.waitForFunction(async()=>Boolean(await (await import('/src/db.ts')).getProfile()))
  // Install prompt may follow onboarding; reload enters persisted app.
  await page.reload();await page.getByText('Estimates are not instructions', {exact:false}).first().waitFor()
  const stored=await page.evaluate(async()=>{const db=await import('/src/db.ts');return db.getProfile()})
  assert.notEqual(stored.currentWeightKg,stored.targetWeightKg)
  if(units==='metric')await page.screenshot({path:artifacts+'/healthy-dashboard.png',fullPage:false})
  await context.close();count++
 }
 {
  const {context,page}=await setup(healthy);await page.reload()
  await page.getByText('Estimates are not instructions',{exact:false}).first().waitFor()
  const result=await page.evaluate(async()=>{
   const db=await import('/src/db.ts');const p=await db.getProfile()
   await db.addMeal({id:'new-meal',loggedAt:new Date().toISOString(),calories:500,name:'Synthetic meal',kind:'meal'})
   await db.addWorkout({id:'new-workout',loggedAt:new Date().toISOString(),caloriesBurned:20,workoutTypeId:'walk',durationMinutes:5,label:'Synthetic workout',emoji:''})
   await db.saveProfile({...p,bankedCalories:1})
   const incidentalCount=(await db.getWeights()).length
   await db.addWeight({id:'underweight',date:new Date().toISOString(),kg:30})
   let blocked=false;try{await db.saveProfile({...p,targetWeightKg:66})}catch{blocked=true}
   return {incidentalCount,blocked,weights:await db.getWeights()}
  })
  assert.equal(result.incidentalCount,1);assert.equal(result.blocked,true);assert.ok(result.weights.some(w=>w.kg===30))
  await page.reload();await page.getByRole('heading',{name:'Profile safety review'}).waitFor()
  await page.getByLabel('Actual current weight').fill('76');await page.getByRole('button',{name:'Save and continue'}).click()
  await page.getByRole('heading',{name:'Profile safety review'}).waitFor({state:'hidden'})
  assert.equal(await page.getByRole('heading',{name:'Profile safety review'}).count(),0)
  await page.evaluate(async()=>{const db=await import('/src/db.ts');await db.revokeSuitability()})
  await page.reload();await page.getByRole('heading',{name:'Profile safety review'}).waitFor()
  await context.close();count++
 }
 {
  const {context,page}=await setup(healthy);await page.reload()
  await page.getByRole('button',{name:'Profile',exact:true}).click()
  await page.getByLabel('Height (cm)').fill('220')
  await page.getByRole('button',{name:'Save and continue'}).click()
  await page.getByRole('alert').waitFor()
  assert.equal((await page.evaluate(async()=> (await (await import('/src/db.ts')).getProfile()).heightCm)),170)
  await page.getByLabel('Height (cm)').fill('170')
  await page.getByLabel('Goal weight').fill('66')
  await page.getByLabel('Actual current weight').fill('76')
  const beforeFailure=await snapshot(page)
  await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;let fail=true;IDBObjectStore.prototype.put=function(...args){if(this.name==='profile' && fail){fail=false;throw new DOMException('Synthetic save failure','QuotaExceededError')}return original.apply(this,args)}})
  await page.getByRole('button',{name:'Save and continue'}).click()
  await page.getByRole('alert').filter({hasText:'Synthetic save failure'}).waitFor()
  assert.equal(await snapshot(page),beforeFailure)
  await page.getByRole('button',{name:'Save and continue'}).click()
  await page.getByRole('button',{name:'Profile',exact:true}).waitFor()
  await page.getByRole('button',{name:'Weight',exact:true}).click()
  await page.getByText('66.0 kg',{exact:true}).click()
  await page.getByLabel('Weight in kilograms').fill('30')
  await page.getByRole('button',{name:'Save goal',exact:true}).click()
  await page.getByRole('alert').waitFor()
  assert.equal((await page.evaluate(async()=> (await (await import('/src/db.ts')).getProfile()).targetWeightKg)),66)
  await page.getByLabel('Weight in kilograms').fill('')
  await page.getByRole('button',{name:'Save goal',exact:true}).click()
  await page.getByRole('alert').waitFor()
  await page.getByLabel('Weight in kilograms').fill('67')
  await page.getByRole('button',{name:'Save goal',exact:true}).click()
  await page.getByRole('button',{name:'‹ Dashboard'}).click()
  await page.getByRole('button',{name:'Log meal',exact:true}).click()
  await page.getByRole('button',{name:'Use my bank',exact:false}).click()
  await page.getByRole('button',{name:'Log meal',exact:true}).last().click()
  await page.getByRole('button',{name:'Workout',exact:true}).click()
  await page.getByRole('button',{name:'Log workout',exact:true}).click()
  await page.getByRole('button',{name:'Weight',exact:true}).click()
  await page.getByRole('button',{name:'+ Log',exact:true}).click()
  await page.getByLabel('Weight in kilograms').fill('30')
  await page.getByRole('button',{name:'Log reading',exact:true}).click()
  await page.getByRole('heading',{name:'Profile safety review'}).waitFor()
  const data=await page.evaluate(async()=>{const db=await import('/src/db.ts');return {weights:await db.getWeights(),meals:await db.getMeals(),workouts:await db.getWorkouts()}})
  assert.ok(data.weights.some(w=>w.kg===30));assert.equal(data.meals.length,2);assert.equal(data.workouts.length,2)
  await context.close();count++
 }
 {
  const {context,page}=await setup(healthy)
  await page.evaluate(async()=>{await (await import('/src/db.ts')).addWeight({id:'latest-low',date:new Date().toISOString(),kg:30})})
  await page.route('**/src/db.ts',async route=>{
   const response=await route.fetch();let body=await response.text()
   assert.ok(body.includes('async function getWeights() {'))
   body=body.replace('async function getWeights() {','async function getWeights() { await new Promise(resolve => setTimeout(resolve, 400));')
   await route.fulfill({response,body})
  })
  await context.addInitScript(()=>{
   window.unsafeFlash=false
   new MutationObserver(()=>{if(/Accounting projection|Log meal|cal\/day estimated resting/.test(document.body?.innerText||''))window.unsafeFlash=true}).observe(document,{childList:true,subtree:true})
  })
  await page.reload();await page.getByRole('heading',{name:'Profile safety review'}).waitFor()
  assert.equal(await page.evaluate(()=>window.unsafeFlash),false)
  await context.close();count++
 }
 {
  const {context,page}=await setup(healthy)
  await page.evaluate(async()=>{await (await import('/src/db.ts')).addWeight({id:'recent',date:new Date().toISOString(),kg:77})})
  await page.reload();await page.getByRole('button',{name:'Profile',exact:true}).click()
  assert.equal(await page.getByLabel('Actual current weight').inputValue(),'77')
  await page.getByLabel('Name',{exact:true}).fill('Synthetic corrected name')
  await page.getByRole('button',{name:'Save and continue'}).click()
  await page.getByRole('button',{name:'Profile',exact:true}).waitFor()
  assert.equal(await page.evaluate(async()=> (await (await import('/src/db.ts')).getWeights()).length),2)
  await context.close();count++
 }
 for (const retryRevocation of [false,true]) {
  const {context,page}=await setup(healthy);await page.reload()
  await page.getByRole('button',{name:'Profile',exact:true}).click()
  // Ordinary unsaved profile edits must still allow Back.
  await page.getByLabel('Name',{exact:true}).fill('Unsaved')
  await page.getByRole('button',{name:'Back',exact:true}).click()
  await page.getByRole('button',{name:'Profile',exact:true}).click()
  const before=await snapshot(page)
  await page.evaluate(()=>{
   window.failProfileWrites=true
   const original=IDBObjectStore.prototype.put
   IDBObjectStore.prototype.put=function(...args){if(this.name==='profile' && window.failProfileWrites)throw new DOMException('Synthetic persistent failure','QuotaExceededError');return original.apply(this,args)}
  })
  await page.getByRole('checkbox').uncheck()
  await page.getByRole('alert').waitFor()
  await page.getByRole('button',{name:'Back',exact:true}).click()
  assert.equal(await page.getByRole('button',{name:'Log meal',exact:true}).count(),0,'failed revocation must keep dashboard inaccessible after Back')
  assert.equal(await page.getByRole('checkbox').isChecked(),false,'rerender must not restore persisted acknowledgement')
  await page.getByLabel('Name',{exact:true}).fill('Synthetic reaffirmed')
  await page.getByRole('button',{name:'Save and continue'}).click()
  assert.equal(await page.getByRole('button',{name:'Log meal',exact:true}).count(),0)
  assert.equal(await snapshot(page),before,'failed writes preserve stored profile and history')
  if(retryRevocation){
   await page.getByRole('button',{name:'Retry revocation',exact:true}).click()
   await page.getByRole('alert').waitFor()
   await page.evaluate(()=>{window.failProfileWrites=false})
   await page.getByRole('button',{name:'Retry revocation',exact:true}).click()
   await page.waitForFunction(async()=> (await (await import('/src/db.ts')).getProfile()).safetyAcknowledged===false)
   await page.reload()
   await page.getByRole('heading',{name:'Profile safety review'}).waitFor()
   assert.equal(await page.getByRole('checkbox').isChecked(),false)
  }
  await page.getByRole('checkbox').check()
  if(!retryRevocation){
   await page.getByRole('button',{name:'Save and continue'}).click()
   await page.getByRole('alert').filter({hasText:'Synthetic persistent failure'}).waitFor()
   await page.getByRole('button',{name:'Back',exact:true}).click()
   assert.equal(await page.getByRole('button',{name:'Log meal',exact:true}).count(),0,'failed reaffirmation cannot restore guidance')
   await page.evaluate(()=>{window.failProfileWrites=false})
  }
  await page.getByRole('button',{name:'Save and continue'}).click()
  await page.getByRole('button',{name:'Log meal',exact:true}).waitFor()
  const after=JSON.parse(await snapshot(page));const original=JSON.parse(before)
  assert.equal(after[0].safetyAcknowledged,true)
  assert.deepEqual(after.slice(1),original.slice(1),'revocation/reaffirmation preserve health history')
  await context.close();count++
 }
 console.log(`Browser scenarios passed: ${count}`)
} finally {await browser.close()}
