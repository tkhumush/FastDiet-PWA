import { openDB, type IDBPDatabase } from 'idb'
import type { UserProfile, MealEntry, WeightSample } from './types'

const DB_NAME = 'fastdiet'
const DB_VERSION = 1

export type FastDietDB = {
  profile: { key: 'profile'; value: UserProfile }
  meals: { key: string; value: MealEntry; indexes: { byDate: string } }
  weights: { key: string; value: WeightSample; indexes: { byDate: string } }
}

let dbPromise: Promise<IDBPDatabase<FastDietDB>>

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FastDietDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile')
        }
        if (!db.objectStoreNames.contains('meals')) {
          const ms = db.createObjectStore('meals', { keyPath: 'id' })
          ms.createIndex('byDate', 'loggedAt')
        }
        if (!db.objectStoreNames.contains('weights')) {
          const ws = db.createObjectStore('weights', { keyPath: 'id' })
          ws.createIndex('byDate', 'date')
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
