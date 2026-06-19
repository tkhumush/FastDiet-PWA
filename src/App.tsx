import { useState, useCallback, useMemo, useEffect } from 'react'
import type { MealEntry } from './types'
import { useProfile, useMeals, useWeights, useWorkouts } from './store'
import { Onboarding } from './components/Onboarding'
import { InstallPWA } from './components/InstallPWA'
import { Dashboard } from './components/Dashboard'
import { EnergyLog } from './components/EnergyLog'
import { WeightTracker } from './components/WeightTracker'
import { ProfileEdit } from './components/ProfileEdit'

type Screen = 'dashboard' | 'log' | 'weight' | 'profile'

export default function App() {
  const { profile, loading, save: saveProfile } = useProfile()
  const { meals, add: addMeal, update: updateMeal, remove: removeMeal } = useMeals()
  const { weights, add: addWeight, remove: removeWeight } = useWeights()
  const { workouts, add: addWorkout, remove: removeWorkout } = useWorkouts()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [showInstall, setShowInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Use the most recent logged weight for MET estimates, fall back to target weight
  const latestWeightKg = useMemo(() => {
    if (weights.length === 0 || !profile) return profile?.targetWeightKg ?? 70
    return weights[0].kg
  }, [weights, profile])

  const handleResetMelt = useCallback(async () => {
    if (!profile) return
    for (const meal of meals.filter(m => m.kind === 'activityBank')) {
      await removeMeal(meal.id)
    }
    await saveProfile({ ...profile, cumulativeBankedCalories: 0, lastActivityBankDate: null })
  }, [profile, meals, removeMeal, saveProfile])

  // `at` is the moment the melt takes effect. When a melt is paired with logging
  // a meal, pass the meal's timestamp so the bank cursor lands on (not after) the
  // meal — otherwise a meal logged in the past falls before the cursor and is
  // dropped from the calculation. Defaults to now.
  const handleConvertBank = useCallback(async (amount: number, at?: string) => {
    if (!profile) return
    const ts = at ?? new Date().toISOString()
    const bankEntry: MealEntry = {
      id: crypto.randomUUID(),
      calories: Math.round(amount),
      loggedAt: ts,
      name: 'Activity banked',
      kind: 'activityBank',
    }
    await addMeal(bankEntry)
    await saveProfile({
      ...profile,
      cumulativeBankedCalories: profile.cumulativeBankedCalories + amount,
      lastActivityBankDate: ts,
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
    return (
      <Onboarding
        onSave={p => {
          saveProfile(p)
          const alreadyInstalled =
            window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true
          if (!alreadyInstalled) setShowInstall(true)
        }}
      />
    )
  }

  if (showInstall) {
    return <InstallPWA deferredPrompt={deferredPrompt} onDone={() => setShowInstall(false)} />
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
        onDelete={removeWeight}
        onResetMelt={handleResetMelt}
        onBack={() => setScreen('dashboard')}
        saveProfile={saveProfile}
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
