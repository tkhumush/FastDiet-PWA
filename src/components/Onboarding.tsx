import { useState } from 'react'
import type { UserProfile, Sex, Units } from '../types'
import { cmFromFeet, kgFromPounds } from '../fastingMath'
import styles from './Onboarding.module.css'

interface Props {
  onSave: (profile: UserProfile) => void
}

export function Onboarding({ onSave }: Props) {
  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('female')
  const [age, setAge] = useState(30)
  const [units, setUnits] = useState<Units>('metric')
  const [heightCm, setHeightCm] = useState(170)
  const [heightFt, setHeightFt] = useState(5)
  const [heightIn, setHeightIn] = useState(9)
  const [weightKg, setWeightKg] = useState(70)
  const [weightLbs, setWeightLbs] = useState(154)

  function save() {
    const finalHeightCm = units === 'metric' ? heightCm : cmFromFeet(heightFt, heightIn)
    const finalKg = units === 'metric' ? weightKg : kgFromPounds(weightLbs)

    const profile: UserProfile = {
      name,
      sex,
      age,
      heightCm: finalHeightCm,
      targetWeightKg: finalKg,
      units,
      bankedCalories: 0,
      cumulativeBankedCalories: 0,
      lastActivityBankDate: null,
      lastWeeklyCheckInDate: null,
    }
    onSave(profile)
  }

  return (
    <div className={styles.container}>
      <h1>Welcome to FastDiet</h1>
      <p className={styles.subtitle}>
        The app eats at the rate of your future, slimmer self.
      </p>

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
            <label>
              Feet
              <input type="number" min={4} max={7} value={heightFt} onChange={e => setHeightFt(+e.target.value)} />
            </label>
            <label>
              Inches
              <input type="number" min={0} max={11} value={heightIn} onChange={e => setHeightIn(+e.target.value)} />
            </label>
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
          Your burn rate is calculated from your <strong>target</strong> weight — the rate of your future, slimmer self. Eat at that rate until you get there.
        </p>

        <button className={styles.saveBtn} onClick={save}>
          Get started
        </button>
      </div>
    </div>
  )
}
