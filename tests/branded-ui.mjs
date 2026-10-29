import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
const artifacts='/home/taymur/.hermes/cache/scratch/fastdiet-ui-display-artifacts'
await mkdir(artifacts,{recursive:true})
const {chromium}=await import('/home/taymur/.hermes/hermes-agent/node_modules/playwright-core/index.mjs')
const browser=await chromium.launch({executablePath:'/usr/sbin/chromium',headless:true,args:['--no-sandbox']})
try {
 const page=await browser.newPage({viewport:{width:390,height:844}})
 await page.goto(process.env.UI_BASE || 'http://127.0.0.1:4194/app')
 await page.getByRole('heading',{name:'About me'}).waitFor()
 assert.equal(await page.locator('input:not([type=checkbox])').count(),0,'onboarding must use sentence chips rather than an always-visible field form')
 assert.equal(await page.getByRole('checkbox').isChecked(),false)
 for(const [chip,label] of [['Edit age','Age'],['Edit current weight','Actual current weight'],['Edit goal weight','Goal weight']]) {
  await page.getByRole('button',{name:chip,exact:true}).click()
  await page.getByText(`Editing · ${label}`,{exact:false}).waitFor()
  assert.equal(await page.locator('input:not([type=checkbox])').count(),1)
  await page.getByRole('button',{name:'Close',exact:true}).click()
 }
 // Real input gestures must preserve raw invalid values and allow policy to reject them.
 await page.getByRole('button',{name:'Edit goal weight',exact:true}).click()
 await page.getByLabel('Goal weight',{exact:false}).and(page.locator('input')).fill('30')
 await page.getByLabel('Goal weight',{exact:false}).and(page.locator('input')).blur()
 assert.equal(await page.getByLabel('Goal weight',{exact:false}).and(page.locator('input')).inputValue(),'30')
 await page.getByRole('button',{name:'Save and continue',exact:true}).click()
 await page.getByRole('alert').filter({hasText:'Goal must meet'}).waitFor()
 assert.equal(await page.evaluate(async()=> (await import('/src/db.ts')).getProfile().then(Boolean)),false)
 // Seed only synthetic data; every edit below uses visible chip/card controls.
 const precise={name:'Synthetic',sex:'female',age:30,heightCm:170.12345,targetWeightKg:65.123456789,currentWeightKg:75.987654321,units:'metric',bankedCalories:0,cumulativeBankedCalories:0,safetyAcknowledged:true,safetyReviewVersion:1,syntheticUnknown:{retained:true}}
 await page.evaluate(async p=>{await (await import('/src/db.ts')).saveProfile(p)},precise)
 const historyBefore=await page.evaluate(async()=> (await import('/src/db.ts')).getWeights())
 await page.reload();await page.getByRole('button',{name:'Profile',exact:true}).click()
 const chips = async (imperial=false) => {
  for(const [name,text] of [['current weight',imperial?'167.5 lb':'76 kg'],['goal weight',imperial?'143.6 lb':'65.1 kg'],['height',imperial?'5′7″':'170 cm'],['age','30']])
   assert.equal(await page.getByRole('button',{name:`Edit ${name}`,exact:true}).innerText(),text)
 }
 const rawStored = async () => {
  const p=await page.evaluate(async()=> (await import('/src/db.ts')).getProfile())
  for(const key of ['heightCm','targetWeightKg','currentWeightKg']) assert.equal(p[key],precise[key])
 }
 await chips();await rawStored()
 await page.screenshot({path:`${artifacts}/metric-profile-390.png`,fullPage:true})
 for(const name of ['current weight','goal weight','height','age']) {
  await page.getByRole('button',{name:`Edit ${name}`,exact:true}).click()
  const input=page.locator('input:not([type=checkbox])')
  const key={'current weight':'currentWeightKg','goal weight':'targetWeightKg',height:'heightCm',age:'age'}[name]
  assert.equal(await input.inputValue(),String(precise[key]));await input.focus();await input.blur()
  assert.equal(await input.inputValue(),String(precise[key]));await rawStored()
  await page.getByRole('button',{name:'Close',exact:true}).click()
 }
 for(const name of ['Imperial','Metric']) {
  await page.getByRole('button',{name:'Edit units',exact:true}).click()
  await page.getByRole('button',{name,exact:true}).click()
  await page.getByRole('button',{name:'Close',exact:true}).click()
  const imperial=name==='Imperial'
  await chips(imperial);await rawStored()
  for(const [field,key] of [['height','heightCm'],['current weight','currentWeightKg'],['goal weight','targetWeightKg']]) {
   await page.getByRole('button',{name:`Edit ${field}`,exact:true}).click()
   const input=page.locator('input:not([type=checkbox])')
   const scale=imperial?(field==='height'?2.54:0.453592):1
   assert.equal(await input.inputValue(),String(precise[key]/scale))
   if(field==='height') await page.getByText(`Editing · Height (${imperial?'in':'cm'})`,{exact:false}).waitFor()
   await input.focus();await input.blur()
   assert.equal(await input.inputValue(),String(precise[key]/scale))
   await page.getByRole('button',{name:'Close',exact:true}).click()
  }
  await chips(imperial)
  if(imperial) for(const viewport of [{width:390,height:844},{width:320,height:700}]) {
   await page.setViewportSize(viewport)
   await page.screenshot({path:`${artifacts}/imperial-profile-${viewport.width}.png`,fullPage:true})
  }
 }
 await page.getByRole('button',{name:'Save and continue',exact:true}).click()
 await page.getByRole('button',{name:'Profile',exact:true}).waitFor()
 const stored=await page.evaluate(async()=> (await import('/src/db.ts')).getProfile())
 for(const key of ['heightCm','targetWeightKg','currentWeightKg','syntheticUnknown']) assert.deepEqual(stored[key],precise[key],`${key} must survive opening cards and changing units`)
 assert.deepEqual(await page.evaluate(async()=> (await import('/src/db.ts')).getWeights()),historyBefore,'opening the current-weight card must not append or alter a measurement')
 await page.getByRole('button',{name:'Profile',exact:true}).click();await chips();await rawStored()
 // Fresh onboarding and footer reachability at both requested viewport sizes.
 for(const viewport of [{width:320,height:700},{width:390,height:844}]) {
  const context=await browser.newContext({viewport})
  const small=await context.newPage();await small.goto(process.env.UI_BASE || 'http://127.0.0.1:4194/app')
  await small.getByRole('button',{name:'Edit units',exact:true}).click()
  await small.getByRole('button',{name:'Imperial',exact:true}).click()
  await small.getByRole('button',{name:'Close',exact:true}).click()
  assert.equal(await small.getByRole('button',{name:'Edit height',exact:true}).innerText(),'5′7″')
  assert.equal(await small.getByRole('button',{name:'Edit goal weight',exact:true}).innerText(),'154.3 lb')
  await small.screenshot({path:`${artifacts}/imperial-onboarding-${viewport.width}.png`,fullPage:true})
  await small.getByRole('button',{name:'Edit goal weight',exact:true}).click()
  await small.getByLabel('Goal weight',{exact:false}).and(small.locator('input')).fill('30')
  await small.getByRole('button',{name:'Save and continue',exact:true}).click()
  await small.getByRole('alert').waitFor()
  assert.ok(await small.getByRole('alert').evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight&&e.scrollHeight>=e.clientHeight}))
  await small.getByRole('button',{name:'Close',exact:true}).click()
  await small.locator('.fd-ack').scrollIntoViewIfNeeded()
  await small.evaluate(()=>{const b=document.querySelector('.fd-ack').getBoundingClientRect(),f=document.querySelector('.fd-profile-footer').getBoundingClientRect();window.scrollBy(0,Math.max(0,b.bottom-f.top+16))})
  assert.ok(await small.locator('.fd-ack').evaluate(e=>{const b=e.getBoundingClientRect(),f=document.querySelector('.fd-profile-footer').getBoundingClientRect();return b.top>=0&&b.bottom<=f.top}))
  await small.getByRole('checkbox').check();assert.equal(await small.getByRole('checkbox').isChecked(),true)
  assert.equal(await small.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await context.close()
 }
 // Malformed restored values must remain honest prompts even with a valid latest log.
 await page.evaluate(async()=>{const r=indexedDB.open('fastdiet',2);await new Promise(ok=>r.onsuccess=ok);const tx=r.result.transaction('profile','readwrite');tx.objectStore('profile').put({name:'Synthetic',sex:'unsupported',units:'unsupported',age:null,heightCm:null,currentWeightKg:'75',targetWeightKg:null,bankedCalories:0,cumulativeBankedCalories:0,safetyAcknowledged:true,safetyReviewVersion:1,syntheticUnknown:{retained:true}},'profile');await new Promise(ok=>tx.oncomplete=ok);r.result.close()})
 await page.reload();await page.getByRole('heading',{name:'Profile safety review'}).waitFor()
 assert.equal(await page.getByRole('button',{name:'Edit current weight',exact:true}).innerText(),'set / confirm')
 const malformedBefore=await page.evaluate(async()=>{const db=await import('/src/db.ts');return JSON.stringify([await db.getProfile(),await db.getWeights()])})
 for(const name of ['age','current weight','goal weight','height']) {
  await page.getByRole('button',{name:`Edit ${name}`,exact:true}).click()
  const input=page.locator('input:not([type=checkbox])');assert.equal(await input.inputValue(),'');await input.focus();await input.blur()
  await page.getByRole('button',{name:'Close',exact:true}).click()
 }
 await page.getByRole('button',{name:'Save and continue',exact:true}).click();await page.getByRole('alert').waitFor()
 assert.equal(await page.evaluate(async()=>{const db=await import('/src/db.ts');return JSON.stringify([await db.getProfile(),await db.getWeights()])}),malformedBefore)
 assert.equal(await page.getByText('cal/day estimated resting',{exact:false}).count(),0)
 await page.getByRole('button',{name:'Edit age',exact:true}).click()
 await page.getByLabel('Age',{exact:true}).fill('30.12345678912345')
 assert.equal(await page.getByRole('button',{name:'Edit age',exact:true}).innerText(),'30.12345678912345')
 await page.getByRole('button',{name:'Save and continue',exact:true}).click()
 await page.getByRole('alert').filter({hasText:'age'}).waitFor()
 console.log('Branded UI interaction and precision regressions passed (4 scenarios)')
} finally {await browser.close()}
