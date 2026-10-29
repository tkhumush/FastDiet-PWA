import type { UserProfile, WeightSample, Units } from './types.ts'

export const SAFETY_VERSION = 1
export const safetyNotice = 'Estimated resting energy at your goal weight—not a daily food allowance or target. Estimates are not instructions to skip or delay food or compensate with exercise.'
export const suitabilityNotice = 'For adults 18–90 only. Not suitable during pregnancy or breastfeeding, with a current or past eating disorder, or type 1 diabetes treated with insulin. Other diabetes medications or medical conditions require clinician guidance. Acknowledgement cannot establish safety; clinical and dietitian review of this app has not been done.'

export interface SafetyIssue {
  code: 'age' | 'sex' | 'units' | 'height' | 'goal' | 'current_weight' | 'suitability' | 'profile' | 'history'
  message: string
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
export const validWeight = (n: unknown): n is number => finite(n) && n > 0 && n <= 500
export const goalFloor = (heightCm: number) => 18.5 * (heightCm / 100) ** 2
export function displayedFloor(heightCm: number, units: Units) {
  return Math.ceil(goalFloor(heightCm) * (units === 'imperial' ? 1 / 0.453592 : 1) * 10) / 10
}

function planIssues(p: Partial<UserProfile>): SafetyIssue[] {
  const issues: SafetyIssue[] = []
  const add = (code: SafetyIssue['code'], message: string) => issues.push({code, message})
  if (!finite(p.age) || !Number.isInteger(p.age) || p.age < 18 || p.age > 90) {
    add('age', 'Age must be a whole number from 18 to 90. Adult BMI screening is not applied to children.')
  }
  if (p.sex !== 'female' && p.sex !== 'male') add('sex', 'Select a supported sex for the resting estimate.')
  if (p.units !== 'metric' && p.units !== 'imperial') add('units', 'Select metric or imperial units.')
  if (!finite(p.heightCm) || p.heightCm < 130 || p.heightCm > 220) {
    add('height', 'Height must be 130–220 cm.')
  } else if (finite(p.age) && p.age >= 18 && (!finite(p.targetWeightKg) || p.targetWeightKg < goalFloor(p.heightCm) || p.targetWeightKg > 200)) {
    add('goal', 'Goal must meet the adult BMI 18.5 screening floor for your height and be at most 200 kg.')
  }
  return issues
}

export function planReasons(p: Partial<UserProfile>): string[] {
  return planIssues(p).map(issue => issue.message)
}

// Sequence resolves same-millisecond writes without rewriting measurement dates.
export const weightNewestFirst = (a: WeightSample, b: WeightSample) =>
  Date.parse(b.date) - Date.parse(a.date) || (b.sequence ?? 0) - (a.sequence ?? 0)

export function currentWeight(p: Partial<UserProfile>, weights: WeightSample[] = []): unknown {
  const latest = [...weights].sort(weightNewestFirst)[0]
  return latest ? latest.kg : p.currentWeightKg
}

export function evaluateProfile(p: Partial<UserProfile>, weights: WeightSample[] = []) {
  const issues = planIssues(p)
  const add = (code: SafetyIssue['code'], message: string) => issues.push({code, message})
  if (!validWeight(p.currentWeightKg)) add('current_weight', 'Provide or confirm an actual current weight in your profile review.')
  const kg = currentWeight(p, weights)
  if (!validWeight(kg)) {
    add('current_weight', 'Provide an actual current weight greater than zero and at most 500 kg. Goal weight cannot replace it.')
  } else if (finite(p.age) && p.age >= 18 && finite(p.heightCm) && p.heightCm >= 130 && p.heightCm <= 220 && kg < goalFloor(p.heightCm)) {
    add('current_weight', 'Current weight is below the adult BMI 18.5 screening floor. Weight loss and fasting features are unavailable. This screen is not a diagnosis.')
  }
  if (p.safetyAcknowledged !== true || p.safetyReviewVersion !== SAFETY_VERSION) {
    add('suitability', 'Review suitability and confirm all conditions before using fasting features.')
  }
  if (typeof p.name !== 'string') add('profile', 'Provide a valid name.')
  for (const key of ['bankedCalories', 'cumulativeBankedCalories'] as const) {
    if (!finite(p[key]) || p[key]! < 0) add('profile', 'Stored energy balance requires correction.')
  }
  for (const key of ['lastActivityBankDate', 'lastWeeklyCheckInDate', 'currentWeightMeasuredAt'] as const) {
    if (p[key] !== undefined && p[key] !== null && (typeof p[key] !== 'string' || !Number.isFinite(Date.parse(p[key]!)))) {
      add('profile', 'Stored accounting dates require correction.')
    }
  }
  if (weights.some(w => !validWeight(w.kg) || typeof w.date !== 'string' || !Number.isFinite(Date.parse(w.date)) || (w.sequence !== undefined && (!finite(w.sequence) || w.sequence < 0)))) {
    add('history', 'Weight history contains an unsupported measurement requiring review.')
  }
  return {eligible: issues.length === 0, reasons: issues.map(issue => issue.message), issues}
}

export function assertProfile(p: Partial<UserProfile>, weights: WeightSample[] = []) {
  const result = evaluateProfile(p, weights)
  if (!result.eligible) throw new Error(result.reasons.join(' '))
}

// Validate the proposed append with the same timestamp/sequence ordering as storage.
export function proposedWeight(weights: WeightSample[], kg: number, date = new Date().toISOString()): WeightSample {
  return {id: 'proposed-measurement', date, kg, sequence: weights.reduce((n, w) => Math.max(n, Number.isFinite(w.sequence) ? w.sequence! : 0), 0) + 1}
}
