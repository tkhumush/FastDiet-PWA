import { useState, useRef } from 'react'
import styles from './Modal.module.css'

interface Props {
  onSave: (calories: number, name: string, photoDataUrl?: string) => void
  onCancel: () => void
  initialCalories?: number
  initialName?: string
  initialPhoto?: string
}

export function LogMealModal({ onSave, onCancel, initialCalories = 500, initialName = '', initialPhoto }: Props) {
  const [calories, setCalories] = useState(initialCalories)
  const [name, setName] = useState(initialName)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(initialPhoto)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhotoDataUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <h2 className={styles.title}>Log a meal</h2>

        <div className={styles.section}>
          <label className={styles.label}>Calories</label>
          <div className={styles.calRow}>
            <button onClick={() => setCalories(c => Math.max(50, c - 50))}>−</button>
            <span className={styles.calVal}>{calories}</span>
            <button onClick={() => setCalories(c => Math.min(2000, c + 50))}>+</button>
          </div>
          <input
            type="range"
            min={50}
            max={2000}
            step={50}
            value={calories}
            onChange={e => setCalories(+e.target.value)}
            className={styles.slider}
          />
          <div className={styles.presetRow}>
            {[200, 400, 600, 800].map(c => (
              <button key={c} className={`${styles.preset} ${calories === c ? styles.presetActive : ''}`} onClick={() => setCalories(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Meal name</label>
          <input
            className={styles.textInput}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="What did you eat? (optional)"
          />
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Photo</label>
          {photoDataUrl ? (
            <div className={styles.photoPreview}>
              <img src={photoDataUrl} alt="meal" />
              <button className={styles.removePhoto} onClick={() => setPhotoDataUrl(undefined)}>Remove</button>
            </div>
          ) : (
            <div className={styles.photoButtons}>
              <button onClick={() => {
                if (fileRef.current) {
                  fileRef.current.setAttribute('capture', 'environment')
                  fileRef.current.click()
                }
              }}>📷 Camera</button>
              <button onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute('capture')
                  fileRef.current.click()
                }
              }}>🖼 Library</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel}>Cancel</button>
          <button className={styles.save} onClick={() => onSave(calories, name.trim(), photoDataUrl)}>Save</button>
        </div>
      </div>
    </div>
  )
}
