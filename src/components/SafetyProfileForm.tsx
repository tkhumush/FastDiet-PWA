import { useRef, useState } from 'react'
import type { UserProfile, WeightSample } from '../types'
import { evaluateProfile, proposedWeight, displayedFloor, SAFETY_VERSION, safetyNotice, suitabilityNotice } from '../safetyPolicy'
import { bmrPerHour } from '../fastingMath'
import { clearAll } from '../db'
import { SupersededProfileSaveError } from '../store'
import { ResetAppModal } from './ResetAppModal'

export function SafetyProfileForm({profile, latestWeightKg, weights = [], onSave, onBack, onRevoke}: {profile?: UserProfile; weights?: WeightSample[]; latestWeightKg?: number; onSave: (p: UserProfile) => Promise<void> | void; onBack?: () => void; onRevoke?: () => Promise<void>}) {
 const [draft, setDraft] = useState<UserProfile>(() => profile ? ({...profile, ...(profile.currentWeightKg !== undefined && latestWeightKg !== undefined ? {currentWeightKg:latestWeightKg} : {})}) : ({name:'', sex:'female', age:30, heightCm:170, targetWeightKg:70, units:'metric', bankedCalories:0, cumulativeBankedCalories:0, lastActivityBankDate:null, lastWeeklyCheckInDate:null}))
 const [measurementChanged, setMeasurementChanged] = useState(false)
 const [showReset, setShowReset] = useState(false)
 const [error, setError] = useState('')
 const [busy, setBusy] = useState(false)
 const operation = useRef(0)
 const [revocationFailed, setRevocationFailed] = useState(false)
 async function revoke() {
  const current = ++operation.current
  setBusy(true); setError('')
  try { await onRevoke?.(); if (current === operation.current) setRevocationFailed(false) }
  catch { if (current !== operation.current) return; setRevocationFailed(true); setError('Suitability withdrawn for this session. Could not save revocation to storage. Retry revocation before closing or reloading the app, or explicitly reaffirm suitability and save successfully to resume.') }
  finally { if (current === operation.current) setBusy(false) }
 }
 const result = evaluateProfile(draft, measurementChanged ? [...weights, proposedWeight(weights, draft.currentWeightKg!)] : weights)
 const factor = draft.units === 'imperial' ? 0.453592 : 1
 function number(key: 'age' | 'heightCm' | 'targetWeightKg' | 'currentWeightKg', label: string, scale = 1) {
   const value = draft[key]
   return <label style={{display:'grid', gap:6}}>{label}<input aria-label={label} type="number" step="any" min={key === 'age' ? 18 : undefined} max={key === 'age' ? 90 : undefined} value={typeof value === 'number' && Number.isFinite(value) ? +(value / scale).toFixed(4) : ''} onChange={e => {if (key === 'currentWeightKg') setMeasurementChanged(true); setDraft({...draft, ...(key === 'currentWeightKg' ? {currentWeightMeasuredAt: new Date().toISOString()} : {}), [key]: e.target.value === '' ? NaN : Number(e.target.value) * scale})}} /></label>
 }
 async function save() {
  const current = ++operation.current
  setError(''); setBusy(true)
  try { if (!result.eligible) throw new Error(result.reasons.join(' ')); await onSave(profile && !measurementChanged ? {...draft, currentWeightKg:profile.currentWeightKg, currentWeightMeasuredAt:profile.currentWeightMeasuredAt} : draft) } catch (e) {if (current === operation.current && !(e instanceof SupersededProfileSaveError)) setError(e instanceof Error ? e.message : 'Save failed. Please retry.')} finally {if (current === operation.current) setBusy(false)}
 }
 return <main style={{padding:'32px 24px', maxWidth:480, margin:'auto', color:'#F4F8F8', minHeight:'100dvh', background:'#07111A'}}>
  <h1>{profile ? 'Profile safety review' : 'About me'}</h1>
  {onBack && <button disabled={busy} onClick={onBack}>Back</button>}
  <p>{suitabilityNotice}</p>
  <div style={{display:'grid', gap:16}}>
   <label>Name<input aria-label="Name" value={typeof draft.name === 'string' ? draft.name : ''} onChange={e => setDraft({...draft,name:e.target.value})}/></label>
   <label>Sex<select aria-label="Sex" value={draft.sex ?? ''} onChange={e => setDraft({...draft,sex:e.target.value as UserProfile['sex']})}><option value="">Select</option><option value="female">Female</option><option value="male">Male</option></select></label>
   <label>Units<select aria-label="Units" value={draft.units ?? ''} onChange={e => setDraft({...draft,units:e.target.value as UserProfile['units']})}><option value="">Select</option><option value="metric">Metric</option><option value="imperial">Imperial</option></select></label>
   {number('age','Age')}{number('heightCm',draft.units === 'imperial' ? 'Height (in)' : 'Height (cm)',draft.units === 'imperial' ? 2.54 : 1)}
   {number('currentWeightKg',`Actual current weight (${draft.units === 'imperial' ? 'lb' : 'kg'})`,factor)}
   {number('targetWeightKg',`Goal weight (${draft.units === 'imperial' ? 'lb' : 'kg'})`,factor)}
   {typeof draft.age === 'number' && draft.age >= 18 && <p>Minimum adult goal at this height: {Number.isFinite(draft.heightCm) ? displayedFloor(draft.heightCm,draft.units) : '—'} {draft.units === 'imperial' ? 'lb' : 'kg'}. Changing height may require correcting your goal. BMI is a coarse screening guard, not a diagnosis or guarantee of safety.</p>}
   <label><input type="checkbox" disabled={busy} checked={draft.safetyAcknowledged === true && draft.safetyReviewVersion === SAFETY_VERSION} onChange={async e => {
    const checked = e.target.checked
    setDraft({...draft,safetyAcknowledged:checked,safetyReviewVersion:SAFETY_VERSION})
    if (!checked && profile) await revoke()
   }}/>I confirm all suitability conditions above, including clinician guidance where needed.</label>
   <p>{safetyNotice}</p>
   {result.eligible && <p>≈ {Math.round(bmrPerHour(draft.sex,draft.age,draft.heightCm,draft.targetWeightKg)*24)} cal/day estimated resting energy (Harris–Benedict).</p>}
   {!result.eligible && <div role="status">{result.reasons.map((r, i) => <p key={i}>{r}</p>)}</div>}
   {error && <p role="alert">{error}</p>}
   {revocationFailed && <button disabled={busy} onClick={revoke}>Retry revocation</button>}
   <button disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save and continue'}</button>
  </div>
  {profile && <button style={{marginTop:48}} onClick={() => setShowReset(true)}>Reset app</button>}
  {showReset && <ResetAppModal onCancel={() => setShowReset(false)} onConfirm={async () => {try {await clearAll(); window.location.reload()} catch {setError('Reset failed. Please retry.')}}}/>}
 </main>
}
