import { useState, useCallback } from 'react'
import type { MealEntry } from './types'
import { useProfile, useMeals, useWeights } from './store'
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
  const [screen, setScreen] = useState<Screen>('dashboard')

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
        profile={profile}
        onUpdate={updateMeal}
        onDelete={removeMeal}
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
      onAddMeal={addMeal}
      onConvertBank={handleConvertBank}
      onNavigateLog={() => setScreen('log')}
      onNavigateWeight={() => setScreen('weight')}
      onNavigateProfile={() => setScreen('profile')}
    />
  )
}
