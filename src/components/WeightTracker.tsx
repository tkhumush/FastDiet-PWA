import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { WeightSample, UserProfile, Units } from '../types'
import styles from './WeightTracker.module.css'

interface Props {
  weights: WeightSample[]
  profile: UserProfile
  onAdd: (sample: WeightSample) => void
  onDelete: (id: string) => void
  onBack: () => void
}

type Range = '1M' | '3M' | '6M' | '1Y' | 'All'

function cutoffDate(range: Range): Date | null {
  const d = new Date()
  if (range === '1M') { d.setMonth(d.getMonth() - 1); return d }
  if (range === '3M') { d.setMonth(d.getMonth() - 3); return d }
  if (range === '6M') { d.setMonth(d.getMonth() - 6); return d }
  if (range === '1Y') { d.setFullYear(d.getFullYear() - 1); return d }
  return null
}

function display(kg: number, units: Units): string {
  if (units === 'metric') return `${kg.toFixed(1)} kg`
  return `${(kg * 2.20462).toFixed(1)} lb`
}

export function WeightTracker({ weights, profile, onAdd, onDelete, onBack }: Props) {
  const [range, setRange] = useState<Range>('3M')
  const [showLog, setShowLog] = useState(false)
  const [inputVal, setInputVal] = useState(
    profile.units === 'metric'
      ? (weights[0]?.kg ?? profile.targetWeightKg).toFixed(1)
      : ((weights[0]?.kg ?? profile.targetWeightKg) * 2.20462).toFixed(1)
  )

  const sorted = [...weights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const filtered = useMemo(() => {
    const cut = cutoffDate(range)
    return cut ? sorted.filter(s => new Date(s.date) >= cut) : sorted
  }, [sorted, range])

  const chartData = filtered.map(s => ({
    date: new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    value: profile.units === 'metric' ? +s.kg.toFixed(1) : +(s.kg * 2.20462).toFixed(1),
  }))

  const targetDisplay = display(profile.targetWeightKg, profile.units)
  const targetChartVal = profile.units === 'metric'
    ? profile.targetWeightKg
    : profile.targetWeightKg * 2.20462

  function saveWeight() {
    const num = +inputVal
    if (isNaN(num) || num <= 0) return
    const kg = profile.units === 'metric' ? num : num / 2.20462
    onAdd({ id: crypto.randomUUID(), date: new Date().toISOString(), kg })
    setShowLog(false)
  }

  const lbsMelted = profile.cumulativeBankedCalories / 3500

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>‹ Back</button>
        <h1>Weight</h1>
        <button className={styles.addBtn} onClick={() => setShowLog(true)}>+ Log</button>
      </header>

      {profile.cumulativeBankedCalories > 0 && (
        <div className={styles.meltCard}>
          <span className={styles.meltIcon}>💧</span>
          <div>
            <p className={styles.meltTitle}>{lbsMelted.toFixed(2)} lbs melted away</p>
            <p className={styles.meltSub}>From converted calorie surplus</p>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.rangeRow}>
            {(['1M', '3M', '6M', '1Y', 'All'] as Range[]).map(r => (
              <button key={r} className={`${styles.rangeBtn} ${range === r ? styles.rangeActive : ''}`} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                itemStyle={{ color: '#fff' }}
              />
              <ReferenceLine y={targetChartVal} stroke="rgba(255,255,255,0.3)" strokeDasharray="5 3"
                label={{ value: `Goal ${targetDisplay}`, fill: 'rgba(255,255,255,0.4)', fontSize: 10, position: 'insideTopLeft' }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#60a5fa"
                strokeWidth={2.5}
                dot={chartData.length <= 10 ? { r: 4, fill: '#60a5fa', strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: '#93c5fd', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={styles.history}>
        <p className={styles.historyLabel}>History</p>
        {weights.length === 0 ? (
          <div className={styles.empty}>
            <p>⚖️</p>
            <p>No weight readings yet. Tap + Log to start.</p>
          </div>
        ) : (
          weights.map(s => (
            <div key={s.id} className={styles.weightRow}>
              <div className={styles.weightInfo}>
                <span className={styles.weightVal}>{display(s.kg, profile.units)}</span>
                <span className={styles.weightDate}>
                  {new Date(s.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                className={styles.weightDelete}
                onClick={() => { if (confirm('Delete this reading?')) onDelete(s.id) }}
                aria-label="Delete"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>

      {showLog && (
        <div className={styles.logOverlay} onClick={() => setShowLog(false)}>
          <div className={styles.logSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.logHandle} />
            <h2>Log weight</h2>
            <label className={styles.logLabel}>Weight ({profile.units === 'metric' ? 'kg' : 'lbs'})</label>
            <input
              type="number"
              step={0.1}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className={styles.logInput}
              autoFocus
            />
            <div className={styles.logActions}>
              <button className={styles.logCancel} onClick={() => setShowLog(false)}>Cancel</button>
              <button className={styles.logSave} onClick={saveWeight}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
