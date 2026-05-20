import { useState } from 'react'
import type { MealEntry, UserProfile, WorkoutEntry } from '../types'
import { summarize, bmrPerHour, activeEnergyFor } from '../fastingMath'
import { LogMealModal } from './LogMealModal'
import styles from './EnergyLog.module.css'

type LogEntry =
  | { kind: 'meal'; meal: MealEntry }
  | { kind: 'workout'; workout: WorkoutEntry }

interface Props {
  meals: MealEntry[]
  workouts: WorkoutEntry[]
  profile: UserProfile
  onUpdate: (meal: MealEntry) => void
  onDelete: (id: string) => void
  onDeleteWorkout: (id: string) => void
  onBack: () => void
}

function DonutRing({ progress }: { progress: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  const hue = Math.round(0.55 * p * 360)
  return (
    <svg width={34} height={34} viewBox="0 0 34 34">
      <circle cx={17} cy={17} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={3.5} />
      <circle
        cx={17} cy={17} r={r} fill="none"
        stroke={`hsl(${hue}, 80%, 60%)`}
        strokeWidth={3.5}
        strokeDasharray={`${p * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 17 17)"
        style={{ transition: 'stroke-dasharray 0.4s' }}
      />
    </svg>
  )
}

export function EnergyLog({ meals, workouts, profile, onUpdate, onDelete, onDeleteWorkout, onBack }: Props) {
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null)

  const bmrHr = bmrPerHour(profile.sex, profile.age, profile.heightCm, profile.targetWeightKg)
  const pre = summarize(meals, bmrHr, 0)
  const activeEnergy = activeEnergyFor(workouts, pre.fastStartedAt, profile.lastActivityBankDate)
  const summary = summarize(meals, bmrHr, activeEnergy)

  // Merge meals + workouts sorted newest-first
  const entries: LogEntry[] = [
    ...meals.map(m => ({ kind: 'meal' as const, meal: m })),
    ...workouts.map(w => ({ kind: 'workout' as const, workout: w })),
  ].sort((a, b) => {
    const dateA = a.kind === 'meal' ? a.meal.loggedAt : a.workout.loggedAt
    const dateB = b.kind === 'meal' ? b.meal.loggedAt : b.workout.loggedAt
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function fmtDuration(min: number) {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>‹ Back</button>
        <h1>Energy log</h1>
        <div style={{ width: 60 }} />
      </header>

      {entries.length === 0 ? (
        <div className={styles.empty}>
          <p>🍴</p>
          <p>Nothing logged yet.</p>
          <p>Log a meal or workout to see it here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {entries.map(entry => {
            if (entry.kind === 'meal') {
              const { meal } = entry
              const alloc = summary.mealAllocations[meal.id]
              const progress = alloc ? alloc.burned / Math.max(1, meal.calories) : 0
              return (
                <div key={meal.id} className={styles.row}>
                  <div className={styles.thumb}>
                    {meal.photoDataUrl ? (
                      <img src={meal.photoDataUrl} alt="meal" />
                    ) : meal.kind === 'activityBank' ? (
                      <span>🔥</span>
                    ) : (
                      <span>🍽</span>
                    )}
                  </div>
                  <div className={styles.info}>
                    <p className={styles.mealName}>{meal.name || 'Meal'}</p>
                    <div className={styles.meta}>
                      {meal.kind === 'activityBank' ? (
                        <span className={styles.activityTag}>−{meal.calories} cal → weight bank</span>
                      ) : (
                        <>
                          <span>+{meal.calories} cal</span>
                          {alloc && (
                            alloc.owed === 0
                              ? <span className={styles.burned}>✓ burned</span>
                              : <span className={styles.owed}>· {alloc.owed} left</span>
                          )}
                        </>
                      )}
                    </div>
                    <p className={styles.date}>{fmtDate(meal.loggedAt)}</p>
                  </div>
                  {alloc && alloc.owed > 0 && <DonutRing progress={progress} />}
                  <div className={styles.rowActions}>
                    {(meal.kind === 'meal' || meal.kind === 'melt') && (
                      <button className={styles.editBtn} onClick={() => setEditingMeal(meal)}>✎</button>
                    )}
                    <button className={styles.deleteBtn} onClick={() => {
                      if (confirm('Delete this meal?')) onDelete(meal.id)
                    }}>🗑</button>
                  </div>
                </div>
              )
            }

            // Workout row
            const { workout } = entry
            return (
              <div key={workout.id} className={`${styles.row} ${styles.workoutRow}`}>
                <div className={`${styles.thumb} ${styles.workoutThumb}`}>
                  <span>{workout.emoji}</span>
                </div>
                <div className={styles.info}>
                  <p className={styles.mealName}>{workout.label}</p>
                  <div className={styles.meta}>
                    <span>{fmtDuration(workout.durationMinutes)}</span>
                    <span className={styles.workoutCal}>· −{workout.caloriesBurned} cal</span>
                  </div>
                  <p className={styles.date}>{fmtDate(workout.loggedAt)}</p>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.deleteBtn} onClick={() => {
                    if (confirm('Delete this workout?')) onDeleteWorkout(workout.id)
                  }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editingMeal && (
        <LogMealModal
          initialCalories={editingMeal.calories}
          initialName={editingMeal.name}
          initialPhoto={editingMeal.photoDataUrl}
          onSave={(calories, name, photoDataUrl) => {
            onUpdate({ ...editingMeal, calories, name, photoDataUrl })
            setEditingMeal(null)
          }}
          onCancel={() => setEditingMeal(null)}
        />
      )}
    </div>
  )
}
