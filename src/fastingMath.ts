import type { MealEntry, WorkoutEntry, FastSummary, MealAllocation, Sex } from './types'

export function bmrPerHour(sex: Sex, age: number, heightCm: number, targetWeightKg: number): number {
  const daily =
    sex === 'male'
      ? 88.362 + 13.397 * targetWeightKg + 4.799 * heightCm - 5.677 * age
      : 447.593 + 9.247 * targetWeightKg + 3.098 * heightCm - 4.33 * age
  return daily / 24
}

export function activeEnergyFor(
  workouts: WorkoutEntry[],
  fastStartedAt: Date | null,
  bankCursor: string | null
): number {
  if (!fastStartedAt) return 0
  const effectiveStart = bankCursor
    ? new Date(Math.max(fastStartedAt.getTime(), new Date(bankCursor).getTime()))
    : fastStartedAt
  return workouts
    .filter(w => new Date(w.loggedAt) >= effectiveStart)
    .reduce((sum, w) => sum + w.caloriesBurned, 0)
}

export function cmFromFeet(feet: number, inches: number): number {
  return feet * 30.48 + inches * 2.54
}

export function kgFromPounds(pounds: number): number {
  return pounds * 0.453592
}

export function summarize(
  meals: MealEntry[],
  bmrPerHr: number,
  activeEnergy = 0,
  now = new Date()
): FastSummary {
  const sorted = meals
    .filter(m => m.kind !== 'activityBank')
    .slice()
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())

  let pool = 0
  let fastStartIdx: number | null = null
  let previousTime: Date | null = null

  for (let idx = 0; idx < sorted.length; idx++) {
    const meal = sorted[idx]
    const mealTime = new Date(meal.loggedAt)

    if (previousTime) {
      const hours = (mealTime.getTime() - previousTime.getTime()) / 3_600_000
      pool -= bmrPerHr * hours
      if (pool <= 0) fastStartIdx = null
    }
    pool += meal.calories
    if (fastStartIdx === null && pool > 0) {
      fastStartIdx = idx
    }
    previousTime = mealTime
  }

  if (previousTime) {
    const hours = (now.getTime() - previousTime.getTime()) / 3_600_000
    pool -= bmrPerHr * hours
    if (pool <= 0) fastStartIdx = null

    pool -= activeEnergy
    if (pool <= 0) fastStartIdx = null
  }

  const bankBalance = Math.max(0, -pool)
  const allocations: Record<string, MealAllocation> = {}

  if (fastStartIdx === null) {
    for (const meal of sorted) {
      allocations[meal.id] = { burned: meal.calories, owed: 0, isPastFast: true }
    }
    return {
      caloriesOwed: 0,
      bankBalance,
      projectedFinish: null,
      fastStartedAt: null,
      totalCaloriesInFast: 0,
      mealAllocations: allocations,
    }
  }

  const fastStart = new Date(sorted[fastStartIdx].loggedAt)
  const currentMeals = sorted.slice(fastStartIdx)
  const totalInFast = currentMeals.reduce((s, m) => s + m.calories, 0)
  const actuallyBurned = Math.max(0, totalInFast - pool)

  let remaining = actuallyBurned
  for (const meal of currentMeals) {
    const allocated = Math.min(meal.calories, remaining)
    remaining -= allocated
    const burnedInt = Math.round(allocated)
    allocations[meal.id] = { burned: burnedInt, owed: meal.calories - burnedInt, isPastFast: false }
  }
  for (const meal of sorted.slice(0, fastStartIdx)) {
    allocations[meal.id] = { burned: meal.calories, owed: 0, isPastFast: true }
  }

  const projectedFinish = new Date(now.getTime() + (pool / bmrPerHr) * 3_600_000)

  return {
    caloriesOwed: Math.max(0, pool),
    bankBalance: 0,
    projectedFinish,
    fastStartedAt: fastStart,
    totalCaloriesInFast: totalInFast,
    mealAllocations: allocations,
  }
}
