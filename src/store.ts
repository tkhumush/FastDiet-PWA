import { weightNewestFirst } from './safetyPolicy'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { UserProfile, MealEntry, WeightSample, WorkoutEntry } from './types'
import * as db from './db'

export class SupersededProfileSaveError extends Error {
  constructor() { super('Profile save superseded by suitability withdrawal.'); this.name = 'SupersededProfileSaveError' }
}

export function useProfile() {
  const revocationGeneration = useRef(0)
  const restricted = useRef(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getProfile().then(p => {
      setProfile(p ?? null)
      setLoading(false)
    })
  }, [])

  const save = useCallback(async (p: UserProfile, options?: {reaffirm: true}) => {
    const generation = revocationGeneration.current
    const assertCurrent = () => {
      if (generation !== revocationGeneration.current || (restricted.current && !options?.reaffirm)) {
        throw new SupersededProfileSaveError()
      }
    }
    assertCurrent()
    // Check again inside the transaction, after any IndexedDB lock has cleared.
    await db.saveProfile(p, assertCurrent)
    assertCurrent()
    restricted.current = false
    setProfile(p)
    // Callers must also check after their own asynchronous follow-up work.
    return assertCurrent
  }, [])

  const revoke = useCallback(async () => {
    // This latch survives failed persistence and stale callbacks. Only an explicit
    // validated reaffirmation begun in this generation can release it.
    revocationGeneration.current += 1
    restricted.current = true
    setProfile(p => p ? {...p, safetyAcknowledged: false} : p)
    await db.revokeSuitability()
  }, [])

  return { profile, loading, save, revoke }
}

export function useMeals() {
  const [meals, setMeals] = useState<MealEntry[]>([])

  const refresh = useCallback(async () => {
    const all = await db.getMeals()
    setMeals(all.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback(async (meal: MealEntry) => {
    await db.addMeal(meal)
    await refresh()
  }, [refresh])

  const update = useCallback(async (meal: MealEntry) => {
    await db.updateMeal(meal)
    await refresh()
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    await db.deleteMeal(id)
    await refresh()
  }, [refresh])

  return { meals, add, update, remove, refresh }
}

export function useWeights() {
  const [loading, setLoading] = useState(true)
  const [weights, setWeights] = useState<WeightSample[]>([])

  const refresh = useCallback(async () => {
    const all = await db.getWeights()
    setLoading(false)
    setWeights(all.sort(weightNewestFirst))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback(async (sample: WeightSample) => {
    await db.addWeight(sample)
    await refresh()
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    await db.deleteWeight(id)
    await refresh()
  }, [refresh])

  return { weights, loading, add, remove, refresh }
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])

  const refresh = useCallback(async () => {
    const all = await db.getWorkouts()
    setWorkouts(all.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback(async (workout: WorkoutEntry) => {
    await db.addWorkout(workout)
    await refresh()
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    await db.deleteWorkout(id)
    await refresh()
  }, [refresh])

  return { workouts, add, remove }
}
