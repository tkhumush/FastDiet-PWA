import { useState, useCallback, useMemo } from 'react'
import type { MealEntry } from './types'
import { useProfile, useMeals, useWeights, useWorkouts } from './store'
import { Onboarding } from './components/Onboarding'
import { Dashboard } from './components/Dashboard'
import { EnergyLog } from './components/EnergyLog'
import { WeightTracker } from './components/WeightTracker'
import { ProfileEdit } from './components/ProfileEdit'

type Screen = 'dashboard' | 'log' | 'weight' | 'profile'

export default function App() {
  const { profile, loading, save: saveProfile } = useProfile()
  const { meals, add: addMeal, update: updateMeal, remove: removeMeal } = useMeals()
  const { weights, add: addWeight } = useWeights()
  const { workouts, add: addWorkout, remove: removeWorkout } = useWorkouts()
  const [screen, setScreen] = useState<Screen>('dashboard')

  // Use the most recent logged weight for MET estimates, fall back to target weight
  const latestWeightKg = useMemo(() => {
    if (weights.length === 0 || !profile) return profile?.targetWeightKg ?? 70
    return weights[0].kg
  }, [weights, profile])

  const handleConvertBank = useCallback(async (amount: number) => {
    if (!profile) return
    const bankEntry: MealEntry = {
      id: crypto.randomUUID(),
      calories: Math.round(amount),
      loggedAt: new Date().toISOString(),
      name: 'Activity banked',
      kind: 'activityBank',
    }
    await addMeal(bankEntry)
    await saveProfile({
      ...profile,
      cumulativeBankedCalories: profile.cumulativeBankedCalories + amount,
      lastActivityBankDate: new Date().toISOString(),
    })
  }, [profile, addMeal, saveProfile])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', fontWeight: 100 }}>FastDiet</div>
      </div>
    )
  }

  if (!profile) {
    return <Onboarding onSave={saveProfile} />
  }

  if (screen === 'log') {
    return (
      <EnergyLog
        meals={meals}
        workouts={workouts}
        profile={profile}
        onUpdate={updateMeal}
        onDelete={removeMeal}
        onDeleteWorkout={removeWorkout}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'weight') {
    return (
      <WeightTracker
        weights={weights}
        profile={profile}
        onAdd={addWeight}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'profile') {
    return (
      <ProfileEdit
        profile={profile}
        onSave={async updated => { await saveProfile(updated); setScreen('dashboard') }}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  return (
    <Dashboard
      profile={profile}
      meals={meals}
      workouts={workouts}
      latestWeightKg={latestWeightKg}
      onAddMeal={addMeal}
      onAddWorkout={addWorkout}
      onConvertBank={handleConvertBank}
      onNavigateLog={() => setScreen('log')}
      onNavigateWeight={() => setScreen('weight')}
      onNavigateProfile={() => setScreen('profile')}
    />
  )
}
