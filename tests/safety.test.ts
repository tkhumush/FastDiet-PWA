import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bmrPerHour } from '../src/fastingMath.ts'
test('minor with unsafe goal cannot receive resting energy estimate', () => {
  assert.throws(() => bmrPerHour('female', 15, 150, 30))
})
import { evaluateProfile, goalFloor, displayedFloor, currentWeight, SAFETY_VERSION } from '../src/safetyPolicy.ts'
const adult = {name:'Synthetic', sex:'female', age:30, heightCm:170, targetWeightKg:65, units:'metric', currentWeightKg:75, safetyAcknowledged:true, safetyReviewVersion:SAFETY_VERSION, bankedCalories:0, cumulativeBankedCalories:0} as const
test('healthy adult formula remains Harris–Benedict', () => assert.equal(bmrPerHour('female',30,170,65), (447.593+9.247*65+3.098*170-4.33*30)/24))
for (const age of [17,18,18.5,90,91,NaN,Infinity,'18',[],null]) test(`age ${JSON.stringify(age)} fails closed or meets adult range`, () => assert.equal(evaluateProfile({...adult,age} as never).eligible, age === 18 || age === 90))
for (const key of ['heightCm','targetWeightKg','currentWeightKg','bankedCalories','cumulativeBankedCalories']) for (const value of [NaN,Infinity,'70',[],null]) test(`${key} rejects ${String(value)}`, () => assert.equal(evaluateProfile({...adult,[key]:value} as never).eligible,false))
for (const heightCm of [130,150,170,220]) test(`goal boundary and rounded units at ${heightCm}`, () => {
 const floor = goalFloor(heightCm)
 for (const offset of [-0.00001,0,0.00001]) assert.equal(evaluateProfile({...adult,heightCm,currentWeightKg:150,targetWeightKg:floor+offset}).eligible,offset>=0)
 for (const units of ['metric','imperial'] as const) assert.ok(displayedFloor(heightCm,units)*(units==='metric'?1:0.453592)>=floor)
})
test('height changes invalidate existing goal', () => assert.equal(evaluateProfile({...adult,heightCm:220}).eligible,false))
for (const patch of [{sex:'x'},{units:'x'},{heightCm:129},{heightCm:221},{currentWeightKg:30},{currentWeightKg:undefined},{safetyAcknowledged:false},{safetyAcknowledged:undefined},{safetyReviewVersion:0},{safetyReviewVersion:2}]) test(`reject ${JSON.stringify(patch)}`, () => assert.equal(evaluateProfile({...adult,...patch} as never).eligible,false))
test('latest actual reading wins without heavier fallback', () => {
 const weights = [{id:'old',date:'2026-01-01',kg:80},{id:'new',date:'2026-10-01',kg:30}]
 assert.equal(currentWeight(adult,weights),30)
 assert.equal(evaluateProfile(adult,weights).eligible,false)
})
test('minor receives no current adult BMI interpretation', () => assert.ok(!evaluateProfile({...adult,age:15,currentWeightKg:30}).reasons.some(r=>r.startsWith('Current weight is below'))))
import { summarize } from '../src/fastingMath.ts'
test('unsupported source estimate cannot enter timer math', () => {
 for (const invalid of [NaN, Infinity, 0, -1, '70']) assert.throws(()=>summarize([],invalid as number))
})
test('legacy missing actual weight cannot activate using history alone', () => {
 const p = {...adult,currentWeightKg:undefined}
 assert.equal(evaluateProfile(p,[{id:'old',date:'2026-01-01',kg:75}]).eligible,false)
})
test('structured safety reasons include stable issue categories', () => assert.ok(evaluateProfile({...adult,age:17}).issues.some(i=>i.code==='age' && i.message)))
test('same-timestamp measurements use persisted write order', () => {
 const date = '2026-10-29T12:00:00Z'
 assert.equal(currentWeight(adult,[{id:'heavy',date,kg:75,sequence:1},{id:'low',date,kg:30,sequence:2}]),30)
})

test('explicit supported weight maxima reject larger values', () => {
 assert.equal(evaluateProfile({...adult,currentWeightKg:501}).eligible,false)
 assert.equal(evaluateProfile({...adult,targetWeightKg:201}).eligible,false)
})

import { proposedWeight } from '../src/safetyPolicy.ts'
test('proposed correction retains malformed history and same-time sequence precedence', () => {
 const date = '2026-10-29T12:00:00Z'
 const weights = [{id:'low',date,kg:30,sequence:4}]
 const proposed = proposedWeight(weights,75,date)
 assert.equal(proposed.sequence,5)
 assert.equal(evaluateProfile(adult,[...weights,proposed]).eligible,true)
 assert.equal(evaluateProfile(adult,[{id:'bad',date:'2026-01-01',kg:'invalid'} as never,...weights,proposed]).eligible,false)
 assert.equal(evaluateProfile(adult,[{id:'future-low',date:'2026-10-30',kg:30},proposed]).eligible,false)
})
