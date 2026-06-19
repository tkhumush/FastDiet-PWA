import { useState, useEffect, useRef, useCallback } from 'react'
import type { UserProfile, MealEntry, WorkoutEntry } from '../types'
import { summarize, bmrPerHour, activeEnergyFor } from '../fastingMath'
import { WaterFill } from './WaterFill'
import { LogMealModal } from './LogMealModal'
import { LogWorkoutModal } from './LogWorkoutModal'
import { BankChoiceModal } from './BankChoiceModal'
import { Eyebrow } from './shared/Eyebrow'

interface Props {
  profile: UserProfile
  meals: MealEntry[]
  workouts: WorkoutEntry[]
  latestWeightKg: number
  onAddMeal: (meal: MealEntry) => void
  onAddWorkout: (workout: WorkoutEntry) => void
  onConvertBank: (amount: number, at?: string) => void
  onNavigateLog: () => void
  onNavigateWeight: () => void
  onNavigateProfile: () => void
}

const TK = {
  bg: 'radial-gradient(120% 60% at 50% -10%, rgba(76,217,210,0.20), rgba(76,217,210,0.03) 38%, transparent 65%), radial-gradient(120% 60% at 50% 110%, rgba(240,138,110,0.10), transparent 60%), #07111A',
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
  hairline: 'rgba(255,255,255,0.07)',
  teal: '#4CD9D2',
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
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function NavBtn({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        color: TK.muted,
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 500,
        padding: '6px 10px',
        fontFamily: 'inherit',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function Dashboard({
  profile, meals, workouts, latestWeightKg,
  onAddMeal, onAddWorkout, onConvertBank,
  onNavigateLog, onNavigateWeight, onNavigateProfile,
}: Props) {
  const [showMealModal, setShowMealModal] = useState(false)
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showBankChoice, setShowBankChoice] = useState(false)
  // When > 0, the user chose "Melt it away" and the melt is pending the meal they
  // are about to log. We hold the amount and apply the melt on save, anchored to
  // the meal's timestamp so past-dated meals still count. See handleConvertBank.
  const [pendingMelt, setPendingMelt] = useState(0)

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

  useEffect(() => {
    setView(buildView(new Date()))
  }, [meals, workouts, profile, buildView])

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

  const { summary, fillFraction } = view

  function handleLogMealClick() {
    if (summary.bankBalance > 0) {
      setShowBankChoice(true)
    } else {
      setShowMealModal(true)
    }
  }

  const isBanked = summary.bankBalance > 0
  const eyebrowLabel = isBanked ? 'Calories ahead' : 'You owe'
  const heroNumber = isBanked
    ? `−${Math.round(summary.bankBalance)}`
    : Math.round(summary.caloriesOwed)
  const initial = (profile.name || '?').trim().charAt(0).toUpperCase() || '?'

  let sentenceRow: React.ReactNode = null
  if (isBanked) {
    sentenceRow = (
      <div
        style={{
          marginTop: 18,
          fontSize: 18,
          fontWeight: 500,
          lineHeight: 1.65,
          letterSpacing: '-0.005em',
          color: TK.muted,
        }}
      >
        You've burned more than you ate — fat is converting. Eat when you're hungry.
      </div>
    )
  } else if (summary.projectedFinish && summary.caloriesOwed > 0) {
    sentenceRow = (
      <div
        style={{
          marginTop: 18,
          fontSize: 18,
          fontWeight: 500,
          lineHeight: 1.65,
          letterSpacing: '-0.005em',
          color: TK.muted,
        }}
      >
        Next meal at{' '}
        <span
          style={{
            color: TK.text,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            padding: '2px 10px',
            borderRadius: 10,
            background: 'rgba(76,217,210,0.10)',
            boxShadow: 'inset 0 0 0 1px rgba(76,217,210,0.30)',
          }}
        >
          {formatTime(summary.projectedFinish)}
        </span>
        {' '}— that's in{' '}
        <span style={{ color: TK.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {formatRelative(summary.projectedFinish)}
        </span>.
        Burning{' '}
        <span style={{ color: TK.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(bmrHr)}
        </span>
        {' '}cal/hr.
      </div>
    )
  } else {
    sentenceRow = (
      <div
        style={{
          marginTop: 18,
          fontSize: 18,
          fontWeight: 500,
          lineHeight: 1.65,
          letterSpacing: '-0.005em',
          color: TK.muted,
        }}
      >
        Log a meal to start your timer.
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100dvh',
        background: TK.bg,
        color: TK.text,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <WaterFill fillFraction={fillFraction} inBank={isBanked} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <div
          style={{
            flex: 1,
            paddingTop: 56,
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={onNavigateProfile}
              aria-label="Profile"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${TK.hairline}`,
                color: TK.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              {initial}
            </button>
            <Eyebrow size={11}>FastDiet</Eyebrow>
            <div style={{ width: 40 }} />
          </div>

          {/* Hero */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 0',
            }}
          >
            <Eyebrow size={11}>{eyebrowLabel}</Eyebrow>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '-20% -10%',
                  background: 'radial-gradient(50% 55% at 50% 50%, rgba(76,217,210,0.30), transparent 70%)',
                  filter: 'blur(20px)',
                  zIndex: 0,
                }}
              />
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: 120,
                  fontWeight: 200,
                  letterSpacing: '-0.055em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #7BEAE3 75%, #4CD9D2 110%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {heroNumber}
              </span>
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  marginLeft: 8,
                  fontSize: 17,
                  color: TK.muted,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                cal
              </span>
            </div>
            {sentenceRow}
          </div>

          {/* Bottom nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 4px 50px',
              gap: 8,
            }}
          >
            <NavBtn
              label="Log"
              onClick={onNavigateLog}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
                  <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h10" />
                </svg>
              }
            />
            <NavBtn
              label="Workout"
              onClick={() => setShowWorkoutModal(true)}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <button
              onClick={handleLogMealClick}
              style={{
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(120deg, #1E9B97 0%, #4CD9D2 60%, #7BEAE3 105%)',
                backgroundSize: '180% 180%',
                animation: 'fd-shimmer 6s ease-in-out infinite alternate',
                padding: '12px 22px',
                borderRadius: 999,
                color: '#062028',
                fontWeight: 700,
                fontSize: 15,
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 10px 28px rgba(76,217,210,0.40), inset 0 1px 0 rgba(255,255,255,0.4)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
                <path d="M12 4v16m-8-8h16" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
              </svg>
              Log meal
            </button>
            <NavBtn
              label="Weight"
              onClick={onNavigateWeight}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
                  <path strokeLinecap="round" d="M3 17l4-8 4 4 4-6 4 10" />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {showBankChoice && (
        <BankChoiceModal
          bankBalance={summary.bankBalance}
          onUsBank={() => { setShowBankChoice(false); setShowMealModal(true) }}
          onMelt={() => { setPendingMelt(summary.bankBalance); setShowBankChoice(false); setShowMealModal(true) }}
          onCancel={() => setShowBankChoice(false)}
        />
      )}

      {showMealModal && (
        <LogMealModal
          onSave={meal => {
            // Apply a pending melt before logging the meal, anchored to the meal's
            // timestamp so a past-dated meal isn't dropped behind the bank cursor.
            if (pendingMelt > 0) {
              onConvertBank(pendingMelt, meal.loggedAt)
              setPendingMelt(0)
            }
            onAddMeal(meal)
            setShowMealModal(false)
          }}
          onCancel={() => { setPendingMelt(0); setShowMealModal(false) }}
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
