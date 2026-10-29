import {field,fill} from './profile-controls.mjs'
import {test} from 'node:test'
import assert from 'node:assert/strict'
const {chromium}=await import(process.env.BROWSER_CORE_PATH || '/home/taymur/.hermes/hermes-agent/node_modules/playwright-core/index.mjs')
const browser=await chromium.launch({executablePath:'/usr/sbin/chromium',headless:true,args:['--no-sandbox']})
const healthy={name:'Synthetic',sex:'female',age:30,heightCm:130,targetWeightKg:40,currentWeightKg:40,units:'metric',bankedCalories:0,cumulativeBankedCalories:0,safetyAcknowledged:true,safetyReviewVersion:1}
async function setup(p,weights=[]) {
 const context=await browser.newContext();const page=await context.newPage()
 await page.goto('http://127.0.0.1:4190/app')
 await page.evaluate(async({p,weights})=>{const db=await import('/src/db.ts');await db.getProfile();const r=indexedDB.open('fastdiet',2);await new Promise(ok=>r.onsuccess=ok);const tx=r.result.transaction(['profile','weights'],'readwrite');tx.objectStore('profile').put(p,'profile');for(const w of weights)tx.objectStore('weights').put(w);await new Promise(ok=>tx.oncomplete=ok);r.result.close()},{p,weights})
 await page.reload();return {context,page}
}
async function snapshot(page){return page.evaluate(async()=>{const db=await import('/src/db.ts');return JSON.stringify([await db.getProfile(),await db.getWeights(),await db.getMeals(),await db.getWorkouts()])})}
try {
 for(const units of ['metric','imperial']) for(const offset of [-0.00001,0,0.00001]) await test(`raw current floor ${units} ${offset}`,async()=>{
  const {context,page}=await setup({...healthy,units})
  try{
   await page.getByRole('button',{name:'Weight',exact:true}).click();await page.getByRole('button',{name:'+ Log',exact:true}).click()
   const floor=18.5*1.3**2;const input=(floor+offset)/(units==='imperial'?0.453592:1)
   await page.getByLabel(units==='imperial'?'Weight in pounds':'Weight in kilograms').fill(String(input))
   await page.getByRole('button',{name:'Log reading',exact:true}).click()
   await page.waitForFunction(async()=> (await (await import('/src/db.ts')).getWeights()).length===1)
   const result=await page.evaluate(async()=>{const db=await import('/src/db.ts');const policy=await import('/src/safetyPolicy.ts');const weights=await db.getWeights();return {kg:weights[0].kg,eligible:policy.evaluateProfile(await db.getProfile(),weights).eligible}})
   assert.ok(Math.abs(result.kg-(floor+offset))<1e-12,`stored ${result.kg} must preserve ${floor+offset}`)
   assert.equal(result.eligible,offset>=0)
  }finally{await context.close()}
 })
 await test('missing restored age remains blank until explicit correction',async()=>{
  const p={...healthy};delete p.age;const {context,page}=await setup(p)
  try{await page.getByRole('heading',{name:'Profile safety review'}).waitFor();assert.equal(await (await field(page,'Age')).inputValue(),'');assert.ok(!(await page.locator('body').innerText()).includes('cal/day estimated resting'));const before=await snapshot(page);await page.getByRole('button',{name:'Save and continue'}).click();await page.getByRole('alert').waitFor();assert.equal(await snapshot(page),before);await fill(page,'Age','30');await page.getByRole('button',{name:'Save and continue'}).click();await page.getByRole('button',{name:'Profile',exact:true}).waitFor();const after=JSON.parse(await snapshot(page));assert.equal(after[0].age,30);assert.deepEqual(after.slice(1),JSON.parse(before).slice(1))}finally{await context.close()}
 })
 await test('missing restored balance fails save without mutation',async()=>{
  const p={...healthy};delete p.bankedCalories;const {context,page}=await setup(p)
  try{await page.getByRole('heading',{name:'Profile safety review'}).waitFor();const before=await snapshot(page);await page.getByRole('button',{name:'Save and continue'}).click();assert.equal(await snapshot(page),before);assert.ok((await page.locator('body').innerText()).includes('Stored energy balance requires correction.'));assert.ok(!(await page.locator('body').innerText()).includes('cal/day estimated resting'))}finally{await context.close()}
 })
 await test('malformed older history blocks preview and changed-measurement save',async()=>{
  const weights=[{id:'bad',date:'2026-01-01',kg:'invalid'},{id:'good',date:'2026-02-01',kg:40}];const {context,page}=await setup(healthy,weights)
  try{await page.getByRole('heading',{name:'Profile safety review'}).waitFor();assert.ok((await page.locator('body').innerText()).includes('Weight history contains an unsupported measurement'));assert.ok(!(await page.locator('body').innerText()).includes('cal/day estimated resting'));const before=await snapshot(page);await fill(page,'Actual current weight','41');await page.getByRole('button',{name:'Save and continue'}).click();await page.getByRole('alert').waitFor();assert.equal(await snapshot(page),before);const rejected=await page.evaluate(async()=>{const db=await import('/src/db.ts');try{await db.saveProfile({...await db.getProfile(),currentWeightKg:42});return false}catch{return true}});assert.equal(rejected,true);assert.equal(await snapshot(page),before)}finally{await context.close()}
 })
}finally{await browser.close()}
