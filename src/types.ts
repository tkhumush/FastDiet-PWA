export type Sex = 'female' | 'male'
export type Units = 'metric' | 'imperial'
export type EntryKind = 'meal' | 'melt' | 'activityBank'

export interface UserProfile {
  name: string
  sex: Sex
  age: number
  heightCm: number
  targetWeightKg: number
  units: Units
  bankedCalories: number
  cumulativeBankedCalories: number
  lastActivityBankDate: string | null
  lastWeeklyCheckInDate: string | null
}

export interface MealEntry {
  id: string
  calories: number
  loggedAt: string
  name: string
  kind: EntryKind
  photoDataUrl?: string
}

export interface WorkoutEntry {
  id: string
  loggedAt: string
  workoutTypeId: string
  label: string
  emoji: string
  durationMinutes: number
  caloriesBurned: number
}

export interface WeightSample {
  id: string
  date: string
  kg: number
}

export interface MealAllocation {
  burned: number
  owed: number
  isPastFast: boolean
}

export interface FastSummary {
  caloriesOwed: number
  bankBalance: number
  projectedFinish: Date | null
  fastStartedAt: Date | null
  totalCaloriesInFast: number
  mealAllocations: Record<string, MealAllocation>
}
