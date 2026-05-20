import { useState, useEffect } from 'react'
import type { UserProfile, MealEntry } from '../types'
import { summarize, bmrPerHour } from '../fastingMath'
import { WaterFill } from './WaterFill'
import { LogMealModal } from './LogMealModal'
import { BankChoiceModal } from './BankChoiceModal'
import styles from './Dashboard.module.css'

interface Props {
  profile: UserProfile
  meals: MealEntry[]
  onAddMeal: (meal: MealEntry) => void
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

export function Dashboard({ profile, meals, onAddMeal, onConvertBank, onNavigateLog, onNavigateWeight, onNavigateProfile }: Props) {
  const [now, setNow] = useState(new Date())
  const [showMealModal, setShowMealModal] = useState(false)
  const [showBankChoice, setShowBankChoice] = useState(false)
  const [manualActivity, setManualActivity] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const bmrHr = bmrPerHour(profile.sex, profile.age, profile.heightCm, profile.targetWeightKg)
  const summary = summarize(meals, bmrHr, manualActivity, now)

  const dailyAllowance = bmrHr * 24
  const fillFraction = summary.caloriesOwed > 0 ? Math.min(1, summary.caloriesOwed / dailyAllowance) : 0

  function handleLogMealClick() {
    if (summary.bankBalance > 0) {
      setShowBankChoice(true)
    } else {
      setShowMealModal(true)
    }
  }

  function handleBankChoiceUse() {
    setShowBankChoice(false)
    setShowMealModal(true)
  }

  function handleBankChoiceMelt() {
    onConvertBank(summary.bankBalance)
    setShowBankChoice(false)
    setShowMealModal(true)
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
              <span className={styles.metricVal} style={{ color: '#f97316' }}>
                {manualActivity > 0 ? Math.round(manualActivity) : '—'}
              </span>
              <span className={styles.metricLabel}>cal activity</span>
            </div>
          </div>
        </div>

        {manualActivity === 0 && (
          <button
            className={styles.activityBtn}
            onClick={() => {
              const val = prompt('Enter calories burned from activity:')
              if (val && !isNaN(+val)) setManualActivity(prev => prev + +val)
            }}
          >
            + Log activity
          </button>
        )}
      </div>

      <nav className={styles.bottomNav}>
        <button onClick={onNavigateLog}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
            <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h10"/>
          </svg>
          <span>Log</span>
        </button>
        <button className={styles.logMealBtn} onClick={handleLogMealClick}>
          <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <span>Log meal</span>
        </button>
        <button onClick={onNavigateWeight}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
            <circle cx={12} cy={12} r={9}/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
          </svg>
          <span>Weight</span>
        </button>
      </nav>

      {showBankChoice && (
        <BankChoiceModal
          bankBalance={summary.bankBalance}
          onUsBank={handleBankChoiceUse}
          onMelt={handleBankChoiceMelt}
          onCancel={() => setShowBankChoice(false)}
        />
      )}

      {showMealModal && (
        <LogMealModal
          onSave={(calories, name, photoDataUrl) => {
            const meal: MealEntry = {
              id: crypto.randomUUID(),
              calories,
              loggedAt: new Date().toISOString(),
              name,
              kind: 'meal',
              photoDataUrl,
            }
            onAddMeal(meal)
            setShowMealModal(false)
          }}
          onCancel={() => setShowMealModal(false)}
        />
      )}
    </div>
  )
}
