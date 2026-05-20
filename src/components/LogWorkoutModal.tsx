import { useState, useMemo } from 'react'
import type { WorkoutEntry } from '../types'
import { WORKOUT_TYPES, estimateCalories } from '../workoutTypes'
import styles from './LogWorkoutModal.module.css'
import modalStyles from './Modal.module.css'

interface Props {
  weightKg: number
  onSave: (workout: WorkoutEntry) => void
  onCancel: () => void
}

export function LogWorkoutModal({ weightKg, onSave, onCancel }: Props) {
  const [selectedType, setSelectedType] = useState(WORKOUT_TYPES[0])
  const [duration, setDuration] = useState(30)
  const [overrideCalories, setOverrideCalories] = useState<number | null>(null)

  const estimated = useMemo(
    () => estimateCalories(selectedType.met, weightKg, duration),
    [selectedType.met, weightKg, duration]
  )

  const calories = overrideCalories ?? estimated

  function handleSave() {
    onSave({
      id: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
      workoutTypeId: selectedType.id,
      label: selectedType.label,
      emoji: selectedType.emoji,
      durationMinutes: duration,
      caloriesBurned: calories,
    })
  }

  return (
    <div className={modalStyles.overlay} onClick={onCancel}>
      <div className={modalStyles.sheet} onClick={e => e.stopPropagation()}>
        <div className={modalStyles.handle} />
        <h2 className={modalStyles.title}>Log a workout</h2>

        {/* Workout type grid */}
        <div className={modalStyles.section}>
          <label className={modalStyles.label}>Type</label>
          <div className={styles.typeGrid}>
            {WORKOUT_TYPES.map(t => (
              <button
                key={t.id}
                className={`${styles.typeBtn} ${selectedType.id === t.id ? styles.typeBtnActive : ''}`}
                onClick={() => { setSelectedType(t); setOverrideCalories(null) }}
              >
                <span className={styles.typeEmoji}>{t.emoji}</span>
                <span className={styles.typeLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className={modalStyles.section}>
          <label className={modalStyles.label}>Duration</label>
          <div className={styles.durationCustom}>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={duration}
              onChange={e => setDuration(+e.target.value)}
              className={modalStyles.slider}
            />
            <span className={styles.durationVal}>{duration} min</span>
          </div>
        </div>

        {/* Calories result */}
        <div className={styles.calorieSection}>
          <div className={styles.calorieResult}>
            <span className={styles.calorieBig}>{calories}</span>
            <span className={styles.calorieUnit}>cal burned</span>
          </div>
          <p className={styles.calorieNote}>
            Estimated: {selectedType.label} · {selectedType.met} MET · {weightKg.toFixed(1)} kg
          </p>
          {overrideCalories === null ? (
            <button
              className={styles.overrideLink}
              onClick={() => setOverrideCalories(estimated)}
            >
              Edit manually
            </button>
          ) : (
            <div className={styles.overrideRow}>
              <input
                type="number"
                min={1}
                max={3000}
                value={overrideCalories}
                onChange={e => setOverrideCalories(+e.target.value)}
                className={styles.overrideInput}
              />
              <button className={styles.overrideLink} onClick={() => setOverrideCalories(null)}>
                Reset
              </button>
            </div>
          )}
        </div>

        <div className={modalStyles.actions}>
          <button className={modalStyles.cancel} onClick={onCancel}>Cancel</button>
          <button className={modalStyles.save} onClick={handleSave}>Save workout</button>
        </div>
      </div>
    </div>
  )
}
