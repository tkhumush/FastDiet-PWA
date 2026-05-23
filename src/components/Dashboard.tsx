import { useState, useEffect, useRef, useCallback } from 'react'
import type { UserProfile, MealEntry, WorkoutEntry } from '../types'
import { summarize, bmrPerHour, activeEnergyFor } from '../fastingMath'
import { WaterFill } from './WaterFill'
import { LogMealModal } from './LogMealModal'
import { LogWorkoutModal } from './LogWorkoutModal'
import { BankChoiceModal } from './BankChoiceModal'
import styles from './Dashboard.module.css'

interface Props {
  profile: UserProfile
  meals: MealEntry[]
  workouts: WorkoutEntry[]
  latestWeightKg: number
  onAddMeal: (meal: MealEntry) => void
  onAddWorkout: (workout: WorkoutEntry) => void
  onConvertBank: (amount: number) => void
  onNavigateLog: () => void
  onNavigateWeight: () => void
  onNavigateProfile: () => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatRelative(date: Date): string {
  const diff = date.getTime() - Date.now()
  if (diff <= 0) return 'now'
  const totalMin = Math.floor(diff / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `in ${m}m`
  if (m === 0) return `in ${h}h`
  return `in ${h}h ${m}m`
}


export function Dashboard({
  profile, meals, workouts, latestWeightKg,
  onAddMeal, onAddWorkout, onConvertBank,
  onNavigateLog, onNavigateWeight, onNavigateProfile,
}: Props) {
  const [showMealModal, setShowMealModal] = useState(false)
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showBankChoice, setShowBankChoice] = useState(false)

  const bmrHr = bmrPerHour(profile.sex, profile.age, profile.heightCm, profile.targetWeightKg)
  const dailyAllowance = bmrHr * 24

  // Refs keep interval callback current without restarting it
  const mealsRef = useRef(meals)
  const workoutsRef = useRef(workouts)
  const profileRef = useRef(profile)
  const bmrHrRef = useRef(bmrHr)
  const dailyAllowanceRef = useRef(dailyAllowance)
  mealsRef.current = meals
  workoutsRef.current = workouts
  profileRef.current = profile
  bmrHrRef.current = bmrHr
  dailyAllowanceRef.current = dailyAllowance

  const buildView = useCallback((now: Date) => {
    const bhr = bmrHrRef.current
    const p = profileRef.current
    const da = dailyAllowanceRef.current
    const bankCursor = p.lastActivityBankDate ? new Date(p.lastActivityBankDate) : null
    const pre = summarize(mealsRef.current, bhr, 0, now, bankCursor)
    const ae = activeEnergyFor(workoutsRef.current, pre.fastStartedAt, p.lastActivityBankDate)
    const s = summarize(mealsRef.current, bhr, ae, now, bankCursor)
    const fill = s.caloriesOwed > 0 ? Math.min(1, s.caloriesOwed / da) : 0
    return { summary: s, activeEnergy: ae, fillFraction: fill }
  }, [])

  const [view, setView] = useState(() => buildView(new Date()))

  // Recompute immediately when data props change (new meal, workout, profile edit)
  useEffect(() => {
    setView(buildView(new Date()))
  }, [meals, workouts, profile, buildView])

  // The dashboard shows minute-resolution values (cal count, next-meal time), so a
  // once-per-minute tick is plenty — second accuracy would only add repaint flicker.
  // The guard still bails out of re-renders when nothing visible actually changed.
  useEffect(() => {
    const id = setInterval(() => {
      const next = buildView(new Date())
      setView(prev => {
        if (
          Math.round(prev.summary.caloriesOwed) === Math.round(next.summary.caloriesOwed) &&
          Math.round(prev.summary.bankBalance) === Math.round(next.summary.bankBalance) &&
          (prev.summary.bankBalance > 0) === (next.summary.bankBalance > 0) &&
          Math.round(prev.fillFraction * 200) === Math.round(next.fillFraction * 200) &&
          Math.floor((prev.summary.projectedFinish?.getTime() ?? 0) / 60000) ===
            Math.floor((next.summary.projectedFinish?.getTime() ?? 0) / 60000)
        ) return prev
        return next
      })
    }, 60000)
    return () => clearInterval(id)
  }, [buildView])

  const { summary, activeEnergy, fillFraction } = view

  function handleLogMealClick() {
    if (summary.bankBalance > 0) {
      setShowBankChoice(true)
    } else {
      setShowMealModal(true)
    }
  }

  return (
    <div className={styles.container}>
      <WaterFill fillFraction={fillFraction} inBank={summary.bankBalance > 0} />

      <div className={styles.content}>
        <header className={styles.header}>
          <button className={styles.iconBtn} onClick={onNavigateProfile} aria-label="Profile">
            <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </button>
          <span className={styles.appTitle}>FastDiet</span>
          <div style={{ width: 40 }} />
        </header>

        <div className={styles.mainNumber}>
          {summary.bankBalance > 0 ? (
            <>
              <span className={styles.bigNum} style={{ color: 'hsl(210, 80%, 70%)' }}>
                −{Math.round(summary.bankBalance)}
              </span>
              <span className={styles.bigLabel}>cal banked</span>
            </>
          ) : (
            <>
              <span className={styles.bigNum}>{Math.round(summary.caloriesOwed)}</span>
              <span className={styles.bigLabel}>
                {summary.caloriesOwed > 0 ? 'cal to burn' : 'No active fast'}
              </span>
            </>
          )}
        </div>

        <div className={styles.cards}>
          <div className={styles.nextMealCard}>
            {summary.projectedFinish && summary.caloriesOwed > 0 ? (
              <>
                <span className={styles.cardMeta}>Next meal at</span>
                <span className={styles.bigTime}>{formatTime(summary.projectedFinish)}</span>
                <span className={styles.cardMeta}>{formatRelative(summary.projectedFinish)}</span>
              </>
            ) : summary.bankBalance > 0 ? (
              <span className={styles.bankMsg}>Surplus — eat when ready</span>
            ) : (
              <span className={styles.cardMeta}>Log a meal to start your timer</span>
            )}
          </div>

          <div className={styles.metricRow}>
            <div className={styles.metricCard}>
              <span className={styles.metricVal}>{Math.round(bmrHr)}</span>
              <span className={styles.metricLabel}>cal/hr burn</span>
            </div>
            <div className={styles.metricCard}>
              {activeEnergy > 0 ? (
                <>
                  <span className={styles.metricVal} style={{ color: '#f97316' }}>
                    {Math.round(activeEnergy)}
                  </span>
                  <span className={styles.metricLabel}>cal activity</span>
                </>
              ) : (
                <>
                  <span className={styles.metricVal} style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                  <span className={styles.metricLabel}>no activity yet</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className={styles.bottomNav}>
        <button onClick={onNavigateLog}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
            <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h10"/>
          </svg>
          <span>Log</span>
        </button>
        <button onClick={() => setShowWorkoutModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span>Workout</span>
        </button>
        <button className={styles.logMealBtn} onClick={handleLogMealClick}>
          <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <span>Log meal</span>
        </button>
        <button onClick={onNavigateWeight}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
            <path strokeLinecap="round" d="M3 17l4-8 4 4 4-6 4 10"/>
          </svg>
          <span>Weight</span>
        </button>
      </nav>

      {showBankChoice && (
        <BankChoiceModal
          bankBalance={summary.bankBalance}
          onUsBank={() => { setShowBankChoice(false); setShowMealModal(true) }}
          onMelt={() => { onConvertBank(summary.bankBalance); setShowBankChoice(false); setShowMealModal(true) }}
          onCancel={() => setShowBankChoice(false)}
        />
      )}

      {showMealModal && (
        <LogMealModal
          onSave={(calories, name, photoDataUrl) => {
            onAddMeal({
              id: crypto.randomUUID(),
              calories,
              loggedAt: new Date().toISOString(),
              name,
              kind: 'meal',
              photoDataUrl,
            })
            setShowMealModal(false)
          }}
          onCancel={() => setShowMealModal(false)}
        />
      )}

      {showWorkoutModal && (
        <LogWorkoutModal
          weightKg={latestWeightKg}
          onSave={workout => { onAddWorkout(workout); setShowWorkoutModal(false) }}
          onCancel={() => setShowWorkoutModal(false)}
        />
      )}
    </div>
  )
}
