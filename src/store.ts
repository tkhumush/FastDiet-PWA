import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, MealEntry, WeightSample, WorkoutEntry } from './types'
import * as db from './db'

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getProfile().then(p => {
      setProfile(p ?? null)
      setLoading(false)
    })
  }, [])

  const save = useCallback(async (p: UserProfile) => {
    await db.saveProfile(p)
    setProfile(p)
  }, [])

  return { profile, loading, save }
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
  const [weights, setWeights] = useState<WeightSample[]>([])

  const refresh = useCallback(async () => {
    const all = await db.getWeights()
    setWeights(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
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

  return { weights, add, remove }
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
