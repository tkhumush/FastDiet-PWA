import { useState } from 'react'
import type { MealEntry, UserProfile } from '../types'
import { summarize, bmrPerHour } from '../fastingMath'
import { LogMealModal } from './LogMealModal'
import styles from './EnergyLog.module.css'

interface Props {
  meals: MealEntry[]
  profile: UserProfile
  onUpdate: (meal: MealEntry) => void
  onDelete: (id: string) => void
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
        cx={17} cy={17} r={r}
        fill="none"
        stroke={`hsl(${hue}, 80%, 60%)`}
        strokeWidth={3.5}
        strokeDasharray={`${p * circ} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s' }}
      />
    </svg>
  )
}

export function EnergyLog({ meals, profile, onUpdate, onDelete, onBack }: Props) {
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null)

  const bmrHr = bmrPerHour(profile.sex, profile.age, profile.heightCm, profile.targetWeightKg)
  const summary = summarize(meals, bmrHr)

  const sorted = [...meals].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>‹ Back</button>
        <h1>Energy log</h1>
        <div style={{ width: 60 }} />
      </header>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <p>🍴</p>
          <p>Nothing logged yet.</p>
          <p>Log a meal to see it here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {sorted.map(meal => {
            const alloc = summary.mealAllocations[meal.id]
            const progress = alloc ? alloc.burned / Math.max(1, meal.calories) : 0
            return (
              <div key={meal.id} className={styles.row}>
                <div className={styles.thumb}>
                  {meal.photoDataUrl ? (
                    <img src={meal.photoDataUrl} alt="meal" />
                  ) : meal.kind === 'activityBank' ? (
                    <span className={styles.activityIcon}>🔥</span>
                  ) : (
                    <span className={styles.foodIcon}>🍽</span>
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

                {alloc && <DonutRing progress={progress} />}

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
