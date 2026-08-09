import { openDB, type IDBPDatabase } from 'idb'
import type { UserProfile, MealEntry, WeightSample, WorkoutEntry } from './types'

const DB_NAME = 'fastdiet'
const DB_VERSION = 2

export type FastDietDB = {
  profile: { key: 'profile'; value: UserProfile }
  meals: { key: string; value: MealEntry; indexes: { byDate: string } }
  weights: { key: string; value: WeightSample; indexes: { byDate: string } }
  workouts: { key: string; value: WorkoutEntry; indexes: { byDate: string } }
}

let dbPromise: Promise<IDBPDatabase<FastDietDB>>

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FastDietDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('profile')
          const ms = db.createObjectStore('meals', { keyPath: 'id' })
          ms.createIndex('byDate', 'loggedAt')
          const ws = db.createObjectStore('weights', { keyPath: 'id' })
          ws.createIndex('byDate', 'date')
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('workouts')) {
            const wo = db.createObjectStore('workouts', { keyPath: 'id' })
            wo.createIndex('byDate', 'loggedAt')
          }
        }
      },
    })
  }
  return dbPromise
}

export async function getProfile(): Promise<UserProfile | undefined> {
  return (await getDb()).get('profile', 'profile')
}

export async function saveProfile(p: UserProfile): Promise<void> {
  await (await getDb()).put('profile', p, 'profile')
}

export async function getMeals(): Promise<MealEntry[]> {
  return (await getDb()).getAll('meals')
}

export async function addMeal(meal: MealEntry): Promise<void> {
  await (await getDb()).put('meals', meal)
}

export async function updateMeal(meal: MealEntry): Promise<void> {
  await (await getDb()).put('meals', meal)
}

export async function deleteMeal(id: string): Promise<void> {
  await (await getDb()).delete('meals', id)
}

export async function getWeights(): Promise<WeightSample[]> {
  return (await getDb()).getAll('weights')
}

export async function addWeight(sample: WeightSample): Promise<void> {
  await (await getDb()).put('weights', sample)
}

export async function deleteWeight(id: string): Promise<void> {
  await (await getDb()).delete('weights', id)
}

/**
 * Wipe every store — the "reset app" path.
 *
 * Cleared in a single transaction so a failure part-way through cannot leave a
 * half-erased database (e.g. meals gone but the banked-calorie cursor on the
 * profile still pointing at them, which would read as corrupt rather than fresh).
 */
export async function clearAll(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['profile', 'meals', 'weights', 'workouts'], 'readwrite')
  await Promise.all([
    tx.objectStore('profile').clear(),
    tx.objectStore('meals').clear(),
    tx.objectStore('weights').clear(),
    tx.objectStore('workouts').clear(),
    tx.done,
  ])
}

export async function getWorkouts(): Promise<WorkoutEntry[]> {
  return (await getDb()).getAll('workouts')
}

export async function addWorkout(workout: WorkoutEntry): Promise<void> {
  await (await getDb()).put('workouts', workout)
}

export async function deleteWorkout(id: string): Promise<void> {
  await (await getDb()).delete('workouts', id)
}
