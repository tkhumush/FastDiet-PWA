import { useState } from 'react'
import type { UserProfile, Sex, Units } from '../types'
import { cmFromFeet, kgFromPounds } from '../fastingMath'
import styles from './ProfileEdit.module.css'

interface Props {
  profile: UserProfile
  onSave: (updated: UserProfile) => void
  onBack: () => void
}

export function ProfileEdit({ profile, onBack, onSave }: Props) {
  const [name, setName] = useState(profile.name)
  const [sex, setSex] = useState<Sex>(profile.sex)
  const [age, setAge] = useState(profile.age)
  const [units, setUnits] = useState<Units>(profile.units)

  const [heightCm, setHeightCm] = useState(Math.round(profile.heightCm))
  const totalFt = profile.heightCm / 30.48
  const [heightFt, setHeightFt] = useState(Math.floor(totalFt))
  const [heightIn, setHeightIn] = useState(Math.round((totalFt % 1) * 12))

  const [weightKg, setWeightKg] = useState(+profile.targetWeightKg.toFixed(1))
  const [weightLbs, setWeightLbs] = useState(+(profile.targetWeightKg * 2.20462).toFixed(1))

  function save() {
    const finalHeightCm = units === 'metric' ? heightCm : cmFromFeet(heightFt, heightIn)
    const finalKg = units === 'metric' ? weightKg : kgFromPounds(weightLbs)
    onSave({ ...profile, name, sex, age, heightCm: finalHeightCm, targetWeightKg: finalKg, units })
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>Cancel</button>
        <h1>Edit Profile</h1>
        <button className={styles.doneBtn} onClick={save}>Done</button>
      </header>

      <div className={styles.form}>
        <label>
          Name (optional)
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </label>

        <label>Sex</label>
        <div className={styles.segmented}>
          <button className={sex === 'female' ? styles.active : ''} onClick={() => setSex('female')}>Female</button>
          <button className={sex === 'male' ? styles.active : ''} onClick={() => setSex('male')}>Male</button>
        </div>

        <label>
          Age
          <input type="number" min={16} max={99} value={age} onChange={e => setAge(+e.target.value)} />
        </label>

        <label>Units</label>
        <div className={styles.segmented}>
          <button className={units === 'metric' ? styles.active : ''} onClick={() => setUnits('metric')}>Metric</button>
          <button className={units === 'imperial' ? styles.active : ''} onClick={() => setUnits('imperial')}>Imperial</button>
        </div>

        {units === 'metric' ? (
          <label>
            Height (cm)
            <input type="number" min={130} max={220} value={heightCm} onChange={e => setHeightCm(+e.target.value)} />
          </label>
        ) : (
          <div className={styles.row}>
            <label>Feet<input type="number" min={4} max={7} value={heightFt} onChange={e => setHeightFt(+e.target.value)} /></label>
            <label>Inches<input type="number" min={0} max={11} value={heightIn} onChange={e => setHeightIn(+e.target.value)} /></label>
          </div>
        )}

        {units === 'metric' ? (
          <label>
            Target weight (kg)
            <input type="number" min={30} max={200} step={0.1} value={weightKg} onChange={e => setWeightKg(+e.target.value)} />
          </label>
        ) : (
          <label>
            Target weight (lbs)
            <input type="number" min={66} max={440} step={0.1} value={weightLbs} onChange={e => setWeightLbs(+e.target.value)} />
          </label>
        )}

        <p className={styles.note}>
          Your burn rate is calculated from your <strong>target</strong> weight — the rate of your future, slimmer self.
        </p>
      </div>
    </div>
  )
}
