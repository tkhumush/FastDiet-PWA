import { useRef, useState } from 'react'
import type { UserProfile, WeightSample } from '../types'
import { evaluateProfile, proposedWeight, displayedFloor, SAFETY_VERSION, safetyNotice, suitabilityNotice } from '../safetyPolicy'
import { bmrPerHour } from '../fastingMath'
import { clearAll } from '../db'
import { SupersededProfileSaveError } from '../store'
import { Chip } from './shared/Chip'
import { NumberInput } from './shared/NumberInput'
import { Segmented } from './shared/Segmented'
import { ScrubberCard } from './shared/ScrubberCard'
import { CTA } from './shared/CTA'
import { Eyebrow } from './shared/Eyebrow'
import './SafetyProfileForm.css'
import { ResetAppModal } from './ResetAppModal'

export function SafetyProfileForm({profile, latestWeightKg, weights = [], onSave, onBack, onRevoke}: {profile?: UserProfile; weights?: WeightSample[]; latestWeightKg?: number; onSave: (p: UserProfile) => Promise<void> | void; onBack?: () => void; onRevoke?: () => Promise<void>}) {
 const [draft, setDraft] = useState<UserProfile>(() => profile ? ({...profile, ...(typeof profile.currentWeightKg === 'number' && Number.isFinite(profile.currentWeightKg) && latestWeightKg !== undefined ? {currentWeightKg:latestWeightKg} : {})}) : ({name:'', sex:'female', age:30, heightCm:170, targetWeightKg:70, units:'metric', bankedCalories:0, cumulativeBankedCalories:0, lastActivityBankDate:null, lastWeeklyCheckInDate:null}))
 const [active, setActive] = useState<string | null>(null)
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
 const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
 const unit = draft.units === 'imperial' ? 'lb' : 'kg'
 const labels: Record<string, string> = {name:'Name', sex:'Sex', units:'Units', age:'Age', heightCm:`Height (${draft.units === 'imperial' ? 'in' : 'cm'})`, currentWeightKg:`Actual current weight (${unit})`, targetWeightKg:`Goal weight (${unit})`}
 // Chip rounding is presentation only; editors and saved draft retain the raw values.
 const display = (key: 'age' | 'heightCm' | 'currentWeightKg' | 'targetWeightKg') => {
  const value = draft[key]
  if (!finite(value)) return 'set / confirm'
  if (key === 'age') return String(value)
  if (key === 'heightCm') {
   if (draft.units !== 'imperial') return `${Math.round(value)} cm`
   const inches = Math.round(value / 2.54)
   return `${Math.floor(inches / 12)}′${inches % 12}″`
  }
  return `${Number((value / factor).toFixed(1))} ${unit}`
 }
 function chip(key: string, text: string, label: string) {
  return <Chip ariaLabel={`Edit ${label}`} active={active === key} textInput={key === 'name'} onClick={() => {if (!busy) setActive(active === key ? null : key)}}>{text}</Chip>
 }
 const issueCodes: Record<string, string> = {age:'age',heightCm:'height',currentWeightKg:'current_weight',targetWeightKg:'goal',sex:'sex',units:'units'}
 const adult = finite(draft.age) && Number.isInteger(draft.age) && draft.age >= 18 && draft.age <= 90
 const floorCopy = !adult ? <>Confirm an adult age (18–90) before adult goal screening applies.</> : <>Minimum adult goal at this height: {finite(draft.heightCm) && draft.heightCm >= 130 && draft.heightCm <= 220 ? displayedFloor(draft.heightCm,draft.units) : '—'} {unit}. Changing height may require correcting your goal. BMI is a coarse screening guard, not a diagnosis or guarantee of safety.</>
 let editor = null
 if (active === 'name') editor = <input className="fd-name" aria-label="Name" value={typeof draft.name === 'string' ? draft.name : ''} placeholder="Your name" autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false} onChange={e => setDraft({...draft,name:e.target.value})}/>
 else if (active === 'sex') editor = <Segmented options={['Female','Male']} selected={draft.sex === 'female' ? 'Female' : draft.sex === 'male' ? 'Male' : ''} onChange={v => setDraft({...draft,sex:v.toLowerCase() as UserProfile['sex']})}/>
 else if (active === 'units') editor = <Segmented options={['Metric','Imperial']} selected={draft.units === 'metric' ? 'Metric' : draft.units === 'imperial' ? 'Imperial' : ''} onChange={v => setDraft({...draft,units:v.toLowerCase() as UserProfile['units']})}/>
 else if (active) {
  const key = active as 'age' | 'heightCm' | 'currentWeightKg' | 'targetWeightKg'
  const scale = key === 'age' ? 1 : key === 'heightCm' ? (draft.units === 'imperial' ? 2.54 : 1) : factor
  editor = <><NumberInput key={`${key}-${draft.units}`} strict value={finite(draft[key]) ? draft[key]! / scale : NaN} min={key === 'age' ? 18 : key === 'heightCm' ? 130 / scale : key === 'targetWeightKg' && adult && finite(draft.heightCm) ? displayedFloor(draft.heightCm,draft.units) : 0} max={key === 'age' ? 90 : key === 'heightCm' ? 220 / scale : (key === 'targetWeightKg' ? 200 : 500) / scale} step={key === 'age' ? 1 : 0.1} showRange suffix={key === 'age' ? 'yrs' : key === 'heightCm' ? (draft.units === 'imperial' ? 'in' : 'cm') : unit} ariaLabel={labels[key]} onChange={value => {if (key === 'currentWeightKg') setMeasurementChanged(true);setDraft({...draft,...(key === 'currentWeightKg' ? {currentWeightMeasuredAt:new Date().toISOString()} : {}),[key]:value * scale})}}/>
   {key !== 'age' && <div className="fd-unit-toggle"><Segmented dense options={key === 'heightCm' ? ['cm','in'] : ['kg','lb']} selected={key === 'heightCm' ? (draft.units === 'metric' ? 'cm' : draft.units === 'imperial' ? 'in' : '') : (draft.units === 'metric' ? 'kg' : draft.units === 'imperial' ? 'lb' : '')} onChange={v => setDraft({...draft,units:v === 'cm' || v === 'kg' ? 'metric' : 'imperial'})}/></div>}
   {key === 'targetWeightKg' && <p className="fd-support">{floorCopy}</p>}
   {result.issues.filter(i => i.code === issueCodes[key]).map((i,n) => <p className="fd-error" key={n}>{i.message}</p>)}
  </>
 }
 async function save() {
  const current = ++operation.current
  setError(''); setBusy(true)
  try { if (!result.eligible) throw new Error(result.reasons.join(' ')); await onSave(profile && !measurementChanged ? {...draft, currentWeightKg:profile.currentWeightKg, currentWeightMeasuredAt:profile.currentWeightMeasuredAt} : draft) } catch (e) {if (current === operation.current && !(e instanceof SupersededProfileSaveError)) setError(e instanceof Error ? e.message : 'Save failed. Please retry.')} finally {if (current === operation.current) setBusy(false)}
 }
 const restricted = profile && !evaluateProfile(profile, weights).eligible
 return <main className="fd-profile">
  <div className={`fd-profile-content${active ? ' fd-editing' : ''}`}>
   <header className="fd-profile-header">{onBack && <button className="fd-back" disabled={busy} onClick={onBack} aria-label="Back">‹ Dashboard</button>}<Eyebrow color={profile ? 'var(--fd-muted)' : 'var(--fd-teal)'}>{profile ? 'Profile' : 'About me'}</Eyebrow>{profile && <span className="fd-header-spacer"/>}</header>
   <h1 className={restricted ? "fd-review-title" : "fd-sr-title"}>{restricted ? 'Profile safety review' : profile ? 'About me' : 'About me'}</h1>
   <p className="fd-support">{restricted ? 'Your records are retained. Fasting features stay restricted until you review and save a suitable profile.' : 'Tap any value to edit.'}</p>
   <div className="fd-sentence">I'm {chip('name',typeof draft.name === 'string' && draft.name ? draft.name : 'add name','name')}, a {chip('sex',draft.sex === 'male' || draft.sex === 'female' ? draft.sex : 'set sex','sex')}, {chip('age',display('age'),'age')} years old, {chip('heightCm',display('heightCm'),'height')} tall, currently {chip('currentWeightKg',display('currentWeightKg'),'current weight')}, aiming for {chip('targetWeightKg',display('targetWeightKg'),'goal weight')}.</div>
   <div className="fd-units-line">Showing {chip('units',draft.units === 'metric' || draft.units === 'imperial' ? draft.units : 'set units','units')} units</div>
   <section className="fd-safety-card" aria-label="Suitability review">
    <Eyebrow>Before you continue</Eyebrow><p>{suitabilityNotice}</p>
    <label className="fd-ack"><input type="checkbox" disabled={busy} checked={draft.safetyAcknowledged === true && draft.safetyReviewVersion === SAFETY_VERSION} onChange={async e => {
     const checked = e.target.checked
     setDraft({...draft,safetyAcknowledged:checked,safetyReviewVersion:SAFETY_VERSION})
     if (!checked && profile) await revoke()
    }}/>I confirm all suitability conditions above, including clinician guidance where needed.</label>
   </section>
   <p className="fd-support">{floorCopy}</p>
   <p className="fd-support">{safetyNotice}</p>
   {result.eligible && <p className="fd-estimate">≈ {Math.round(bmrPerHour(draft.sex,draft.age,draft.heightCm,draft.targetWeightKg)*24)} cal/day estimated resting energy (Harris–Benedict).</p>}
   {!result.eligible && <div role="status" className="fd-issues">{result.reasons.map((r,i) => <p key={i}>{r}</p>)}</div>}
   {revocationFailed && <button className="fd-secondary" disabled={busy} onClick={revoke}>Retry revocation</button>}
   {profile && <section className="fd-danger"><Eyebrow color="var(--fd-muted)">Danger zone</Eyebrow><button disabled={busy} onClick={() => setShowReset(true)}>Reset app</button><p className="fd-support">Erases every meal, workout and weight reading along with your profile, and starts you over at setup.</p></section>}
  </div>
  <footer className="fd-profile-footer">
   {error && <p className="fd-error fd-footer-error" role="alert">{error}</p>}
   {active && <div className="fd-editor"><fieldset disabled={busy}><ScrubberCard label={labels[active]} onClose={busy ? undefined : () => setActive(null)}>{editor}</ScrubberCard></fieldset></div>}
   <div className="fd-footer-actions">{onBack && <button className="fd-secondary" disabled={busy} onClick={onBack}>Cancel</button>}<CTA ariaLabel={busy ? 'Saving…' : 'Save and continue'} warm={active === 'targetWeightKg'} disabled={busy} onClick={save}>{busy ? 'Saving…' : profile ? 'Save changes' : 'Continue →'}</CTA></div>
  </footer>
  {showReset && <ResetAppModal onCancel={() => {if (!busy) setShowReset(false)}} onConfirm={async () => {try {await clearAll(); window.location.reload()} catch {setError('Reset failed. Please retry.')}}}/>}
 </main>
}
