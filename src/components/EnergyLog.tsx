import { useState } from 'react'
import type { MealEntry, UserProfile, WorkoutEntry } from '../types'
import { summarize, bmrPerHour, activeEnergyFor } from '../fastingMath'
import { Slider } from './shared/Slider'
import { ScrubberCard } from './shared/ScrubberCard'
import { Eyebrow } from './shared/Eyebrow'

interface Props {
  meals: MealEntry[]
  workouts: WorkoutEntry[]
  profile: UserProfile
  onUpdate: (meal: MealEntry) => void
  onDelete: (id: string) => void
  onDeleteWorkout: (id: string) => void
  onBack: () => void
}

const TK = {
  bg: 'radial-gradient(120% 60% at 50% -10%, rgba(76,217,210,0.20), rgba(76,217,210,0.03) 38%, transparent 65%), radial-gradient(120% 60% at 50% 110%, rgba(240,138,110,0.10), transparent 60%), #07111A',
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
  dim: 'rgba(244,248,248,0.32)',
  hairline: 'rgba(255,255,255,0.07)',
  teal: '#4CD9D2',
  coral: '#F08A6E',
}

type LogEntry =
  | { kind: 'meal'; meal: MealEntry }
  | { kind: 'workout'; workout: WorkoutEntry }

function DonutRing({ progress }: { progress: number }) {
  const r = 14
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E9B97" />
          <stop offset="100%" stopColor="#7BEAE3" />
        </linearGradient>
      </defs>
      <circle cx={18} cy={18} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={3.5} />
      <circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        stroke="url(#donut-grad)"
        strokeWidth={3.5}
        strokeDasharray={`${p * c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
        style={{ filter: 'drop-shadow(0 0 4px rgba(76,217,210,0.5))' }}
      />
    </svg>
  )
}

function SummaryStat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '12px 10px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${TK.hairline}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: TK.muted,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 20,
          color: accent,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function fmtRelativeWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  )
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `today · ${time}`
  if (isYesterday) return `yesterday · ${time}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function EntryRow({
  entry,
  active,
  onClick,
  burnedAmount,
}: {
  entry: LogEntry
  active: boolean
  onClick: () => void
  burnedAmount: number
}) {
  if (entry.kind === 'workout') {
    const { workout } = entry
    return (
      <button
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 14,
          background: active ? 'rgba(240,138,110,0.10)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${active ? 'rgba(240,138,110,0.4)' : TK.hairline}`,
          boxShadow: active ? '0 0 22px rgba(240,138,110,0.15)' : 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%',
          textAlign: 'left',
          transition: 'all 0.2s',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(240,138,110,0.10)',
            border: '1px solid rgba(240,138,110,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {workout.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              color: TK.text,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {workout.label}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12,
              color: TK.muted,
              lineHeight: 1.45,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ color: TK.coral, fontWeight: 700 }}>−{workout.caloriesBurned} cal</span>
            &nbsp;· {fmtDuration(workout.durationMinutes)} ·{' '}
            <span style={{ color: TK.dim }}>{fmtRelativeWhen(workout.loggedAt)}</span>
          </div>
        </div>
      </button>
    )
  }

  const { meal } = entry

  // activityBank entries — not tappable, display only
  if (meal.kind === 'activityBank') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 14,
          background: 'rgba(240,138,110,0.06)',
          border: '1px solid rgba(240,138,110,0.22)',
          fontFamily: 'inherit',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(240,138,110,0.10)',
            border: '1px solid rgba(240,138,110,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          🔥
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, color: TK.text, fontWeight: 600 }}>{meal.name || 'Activity banked'}</div>
          <div style={{ marginTop: 3, fontSize: 12, color: TK.muted, lineHeight: 1.45, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: TK.coral, fontWeight: 700 }}>−{meal.calories} cal</span>
            &nbsp;→ weight bank ·{' '}
            <span style={{ color: TK.dim }}>{fmtRelativeWhen(meal.loggedAt)}</span>
          </div>
        </div>
      </div>
    )
  }

  const owed = Math.max(0, meal.calories - burnedAmount)
  const progress = Math.min(1, burnedAmount / Math.max(1, meal.calories))
  const burnedFully = owed === 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        background: active ? 'rgba(76,217,210,0.08)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${active ? 'rgba(76,217,210,0.4)' : TK.hairline}`,
        boxShadow: active ? '0 0 22px rgba(76,217,210,0.15)' : 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.2s',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: meal.photoDataUrl
            ? `url(${meal.photoDataUrl}) center / cover`
            : 'rgba(76,217,210,0.10)',
          border: `1px solid ${meal.photoDataUrl ? TK.hairline : 'rgba(76,217,210,0.22)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {!meal.photoDataUrl && <span>🍽</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            color: TK.text,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {meal.name || 'Meal'}
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 12,
            color: TK.muted,
            lineHeight: 1.45,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span style={{ color: TK.text, fontWeight: 700 }}>+{meal.calories} cal</span>
          {burnedFully ? (
            <> · <span style={{ color: TK.teal }}>✓ burned</span></>
          ) : (
            <> · <span style={{ color: TK.coral }}>{owed} left</span></>
          )}
          &nbsp;· <span style={{ color: TK.dim }}>{fmtRelativeWhen(meal.loggedAt)}</span>
        </div>
      </div>
      {!burnedFully && <DonutRing progress={progress} />}
      {burnedFully && (
        <span
          style={{
            fontSize: 18,
            color: TK.teal,
            filter: 'drop-shadow(0 0 8px rgba(76,217,210,0.6))',
          }}
        >
          ✓
        </span>
      )}
    </button>
  )
}

export function EnergyLog({ meals, workouts, profile, onUpdate, onDelete, onDeleteWorkout, onBack }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingCal, setPendingCal] = useState<number>(0)

  const bmrHr = bmrPerHour(profile.sex, profile.age, profile.heightCm, profile.targetWeightKg)
  const pre = summarize(meals, bmrHr, 0)
  const activeEnergy = activeEnergyFor(workouts, pre.fastStartedAt, profile.lastActivityBankDate)
  const summary = summarize(meals, bmrHr, activeEnergy)

  // Today's totals (filter by today)
  const todayMeals = meals.filter(m => m.kind === 'meal' && isToday(m.loggedAt))
  const todayWorkouts = workouts.filter(w => isToday(w.loggedAt))
  const ateToday = todayMeals.reduce((s, m) => s + m.calories, 0)
  const burnedToday = todayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0)
  const owedToday = Math.round(summary.caloriesOwed)

  // Merge entries
  const entries: LogEntry[] = [
    ...meals.map(m => ({ kind: 'meal' as const, meal: m })),
    ...workouts.map(w => ({ kind: 'workout' as const, workout: w })),
  ].sort((a, b) => {
    const da = a.kind === 'meal' ? a.meal.loggedAt : a.workout.loggedAt
    const db = b.kind === 'meal' ? b.meal.loggedAt : b.workout.loggedAt
    return new Date(db).getTime() - new Date(da).getTime()
  })

  const activeEntry = entries.find(e => {
    const id = e.kind === 'meal' ? e.meal.id : e.workout.id
    return id === activeId
  }) || null

  function openEntry(e: LogEntry) {
    if (e.kind === 'meal') {
      if (e.meal.kind === 'activityBank') return // not editable
      setActiveId(e.meal.id)
      setPendingCal(e.meal.calories)
    } else {
      setActiveId(e.workout.id)
      setPendingCal(e.workout.caloriesBurned)
    }
  }

  function closeEdit() {
    setActiveId(null)
    setPendingCal(0)
  }

  function saveEdit() {
    if (!activeEntry || !activeId) return
    if (activeEntry.kind === 'meal') {
      onUpdate({ ...activeEntry.meal, calories: pendingCal })
    }
    // For workouts we don't have an update handler in App's flow; skip
    closeEdit()
  }

  function deleteEntry() {
    if (!activeEntry || !activeId) return
    if (activeEntry.kind === 'meal') {
      onDelete(activeEntry.meal.id)
    } else {
      onDeleteWorkout(activeEntry.workout.id)
    }
    closeEdit()
  }

  let scrubber: React.ReactNode = null
  if (activeEntry) {
    const isMeal = activeEntry.kind === 'meal'
    const label = isMeal ? (activeEntry.meal.name || 'Meal') : activeEntry.workout.label
    const minCal = isMeal ? 50 : 10
    const maxCal = isMeal ? 2000 : 1500
    const stepCal = isMeal ? 10 : 5
    scrubber = (
      <ScrubberCard
        label={label}
        displayValue={
          <span>
            {isMeal ? '+' : '−'}{pendingCal}
            <span style={{ fontSize: 14, color: TK.muted, marginLeft: 5, fontWeight: 500 }}>cal</span>
          </span>
        }
        visible
        onClose={closeEdit}
        danger={{ label: '🗑 Delete', onClick: deleteEntry }}
        primary={isMeal ? { label: 'Save', onClick: saveEdit } : undefined}
      >
        <Slider
          value={pendingCal}
          min={minCal}
          max={maxCal}
          step={stepCal}
          onChange={setPendingCal}
          showRange
        />
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 11.5,
            color: TK.dim,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {isMeal
            ? fmtRelativeWhen(activeEntry.meal.loggedAt)
            : `${fmtDuration(activeEntry.workout.durationMinutes)} · ${fmtRelativeWhen(activeEntry.workout.loggedAt)}`}
        </p>
      </ScrubberCard>
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
      }}
    >
      <div style={{ minHeight: '100dvh', overflow: 'auto' }}>
        <div
          style={{
            minHeight: '100dvh',
            paddingTop: 60,
            paddingBottom: scrubber ? 300 : 60,
            paddingLeft: 24,
            paddingRight: 24,
            boxSizing: 'border-box',
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
              gap: 8,
            }}
          >
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: TK.muted,
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              ‹ Dashboard
            </button>
            <Eyebrow color={TK.muted} size={11}>Energy log</Eyebrow>
            <div style={{ width: 80 }} />
          </div>

          {/* Sentence summary */}
          <div style={{ marginBottom: 22 }}>
            <Eyebrow size={11}>Today</Eyebrow>
            <div
              style={{
                marginTop: 10,
                fontSize: 24,
                fontWeight: 500,
                lineHeight: 1.55,
                letterSpacing: '-0.012em',
                color: TK.muted,
              }}
            >
              You ate&nbsp;
              <span style={{ color: TK.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>+{ateToday} cal</span>
              , burned&nbsp;
              <span style={{ color: TK.coral, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>−{burnedToday} cal</span>
              .&nbsp;
              <span style={{ color: TK.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{owedToday} cal</span>
              &nbsp;still owed.
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <SummaryStat label="Ate" value={`+${ateToday}`} accent={TK.teal} />
            <SummaryStat label="Burned" value={`−${burnedToday}`} accent={TK.coral} />
            <SummaryStat label="Owed" value={owedToday} accent={TK.text} />
          </div>

          {/* Entry list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: TK.dim,
                  border: `1px dashed ${TK.hairline}`,
                  borderRadius: 16,
                }}
              >
                Nothing logged. Tap "+ Log meal" on the dashboard to start.
              </div>
            ) : (
              entries.map(e => {
                const id = e.kind === 'meal' ? e.meal.id : e.workout.id
                const burnedAmount = e.kind === 'meal'
                  ? (summary.mealAllocations[e.meal.id]?.burned ?? 0)
                  : 0
                return (
                  <EntryRow
                    key={id}
                    entry={e}
                    active={id === activeId}
                    onClick={() => openEntry(e)}
                    burnedAmount={burnedAmount}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>

      {scrubber && (
        <div
          style={{
            position: 'fixed',
            bottom: 50,
            left: 24,
            right: 24,
            maxWidth: 432,
            margin: '0 auto',
            zIndex: 10,
          }}
        >
          {scrubber}
        </div>
      )}
    </div>
  )
}
