import { useState, useMemo } from 'react'
import type { WorkoutEntry } from '../types'
import { WORKOUT_TYPES, estimateCalories, type WorkoutType } from '../workoutTypes'
import { Chip } from './shared/Chip'
import { NumberInput } from './shared/NumberInput'
import { ScrubberCard } from './shared/ScrubberCard'
import { Eyebrow } from './shared/Eyebrow'

interface Props {
  weightKg: number
  onSave: (workout: WorkoutEntry) => void
  onCancel: () => void
}

type ChipKey = 'type' | 'duration' | 'cal' | null

const TK = {
  bg: 'radial-gradient(120% 60% at 50% -10%, rgba(76,217,210,0.20), rgba(76,217,210,0.03) 38%, transparent 65%), radial-gradient(120% 60% at 50% 110%, rgba(240,138,110,0.10), transparent 60%), #07111A',
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
  dim: 'rgba(244,248,248,0.32)',
  hairline: 'rgba(255,255,255,0.07)',
  teal: '#4CD9D2',
  coral: '#F08A6E',
}

function BreakdownStat({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: number | string
  unit: string
  accent?: string
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          fontSize: 9.5,
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
          fontSize: 18,
          color: accent || TK.text,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}
      >
        {value}
        <span style={{ fontSize: 10, color: TK.dim, fontWeight: 500, marginLeft: 3, letterSpacing: 0 }}>
          {unit}
        </span>
      </span>
    </div>
  )
}

export function LogWorkoutModal({ weightKg, onSave, onCancel }: Props) {
  // Default to cycling (index 2 in WORKOUT_TYPES)
  const [type, setType] = useState<WorkoutType>(WORKOUT_TYPES[2] ?? WORKOUT_TYPES[0])
  const [duration, setDuration] = useState(30)
  const [overrideCal, setOverrideCal] = useState<number | null>(null)
  const [active, setActive] = useState<ChipKey>(null)

  const estimated = useMemo(
    () => estimateCalories(type.met, weightKg, duration),
    [type.met, weightKg, duration]
  )
  const calories = overrideCal ?? estimated

  const closeAll = () => setActive(null)

  function handleSave() {
    onSave({
      id: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
      workoutTypeId: type.id,
      label: type.label,
      emoji: type.emoji,
      durationMinutes: duration,
      caloriesBurned: calories,
    })
  }

  let scrubber: React.ReactNode = null
  if (active === 'type') {
    scrubber = (
      <ScrubberCard label="Type" visible onClose={closeAll}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {WORKOUT_TYPES.map(t => {
            const a = t.id === type.id
            return (
              <button
                key={t.id}
                onClick={() => { setType(t); setOverrideCal(null); closeAll() }}
                style={{
                  padding: '10px 4px',
                  borderRadius: 12,
                  background: a
                    ? 'linear-gradient(180deg, rgba(76,217,210,0.24), rgba(30,155,151,0.16))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${a ? 'rgba(76,217,210,0.55)' : TK.hairline}`,
                  color: a ? TK.text : TK.muted,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{t.emoji}</span>
                {t.label}
              </button>
            )
          })}
        </div>
      </ScrubberCard>
    )
  } else if (active === 'duration') {
    scrubber = (
      <ScrubberCard
        label="Duration"
        displayValue={
          <span>{duration}<span style={{ fontSize: 14, color: TK.muted, marginLeft: 6, fontWeight: 500 }}>min</span></span>
        }
        visible
        onClose={closeAll}
      >
        <NumberInput
          value={duration}
          min={5}
          max={180}
          step={5}
          onChange={n => { setDuration(n); setOverrideCal(null) }}
          suffix="min"
          showRange
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {[15, 30, 45, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => { setDuration(d); setOverrideCal(null) }}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 8,
                background: duration === d ? 'rgba(76,217,210,0.15)' : 'transparent',
                border: `1px solid ${duration === d ? 'rgba(76,217,210,0.4)' : TK.hairline}`,
                color: duration === d ? TK.teal : TK.muted,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {d}m
            </button>
          ))}
        </div>
      </ScrubberCard>
    )
  } else if (active === 'cal') {
    scrubber = (
      <ScrubberCard
        label="Calories burned"
        displayValue={
          <span>−{calories}<span style={{ fontSize: 14, color: TK.muted, marginLeft: 6, fontWeight: 500 }}>cal</span></span>
        }
        visible
        onClose={closeAll}
      >
        <NumberInput
          value={calories}
          min={10}
          max={1500}
          step={5}
          onChange={n => setOverrideCal(n)}
          suffix="cal"
          showRange
        />
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 11.5,
            color: TK.dim,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          {overrideCal === null ? (
            <>Auto-estimated from <span style={{ color: TK.muted }}>{type.met} MET × {weightKg.toFixed(0)} kg × {duration} min</span>.</>
          ) : (
            <>
              Manual override.{' '}
              <button
                onClick={() => setOverrideCal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: TK.teal,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                Reset to estimate
              </button>
            </>
          )}
        </p>
      </ScrubberCard>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: TK.bg,
        color: TK.text,
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      <div style={{ height: '100dvh', overflow: 'auto' }}>
        <div
          style={{
            minHeight: '100dvh',
            paddingTop: 60,
            paddingBottom: scrubber ? 360 : 130,
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
              onClick={onCancel}
              aria-label="Cancel"
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${TK.hairline}`,
                color: TK.muted,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
            <Eyebrow color={TK.muted} size={11}>Log a workout</Eyebrow>
            <div style={{ width: 32 }} />
          </div>

          {/* Sentence */}
          <div style={{ marginBottom: 22 }}>
            <Eyebrow size={11}>Workout</Eyebrow>
            <div
              style={{
                marginTop: 10,
                fontSize: 26,
                fontWeight: 500,
                lineHeight: 1.55,
                letterSpacing: '-0.015em',
                color: TK.muted,
              }}
            >
              You did&nbsp;
              <Chip active={active === 'type'} onClick={() => setActive(active === 'type' ? null : 'type')}>
                <span style={{ marginRight: 4 }}>{type.emoji}</span>{type.label}
              </Chip>
              &nbsp;for&nbsp;
              <Chip active={active === 'duration'} onClick={() => setActive(active === 'duration' ? null : 'duration')}>
                {duration} min
              </Chip>
              &nbsp;— burning&nbsp;
              <Chip active={active === 'cal'} onClick={() => setActive(active === 'cal' ? null : 'cal')}>
                {calories} cal
              </Chip>
              .
            </div>
          </div>

          {/* Burn breakdown card */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(76,217,210,0.10), rgba(240,138,110,0.06))',
              border: '1px solid rgba(76,217,210,0.22)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 12,
              }}
            >
              <Eyebrow size={11}>Burn breakdown</Eyebrow>
              {overrideCal !== null && (
                <span style={{ fontSize: 11, color: TK.coral, fontWeight: 600 }}>● manual</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <BreakdownStat label="Intensity" value={type.met} unit="MET" />
              <BreakdownStat label="Weight" value={weightKg.toFixed(0)} unit="kg" />
              <BreakdownStat label="Time" value={duration} unit="min" />
              <BreakdownStat label="Burned" value={calories} unit="cal" accent={TK.coral} />
            </div>
          </div>
        </div>
      </div>

      {/* Pinned bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 38,
          left: 24,
          right: 24,
          maxWidth: 432,
          margin: '0 auto',
          zIndex: 110,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          pointerEvents: 'none',
        }}
      >
        {scrubber && <div style={{ pointerEvents: 'auto' }}>{scrubber}</div>}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 14,
              textAlign: 'center',
              fontSize: 15,
              fontWeight: 600,
              color: TK.muted,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${TK.hairline}`,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1.6,
              padding: '14px 22px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(120deg, #1E9B97 0%, #4CD9D2 60%, #7BEAE3 105%)',
              backgroundSize: '180% 180%',
              animation: 'fd-shimmer 6s ease-in-out infinite alternate',
              color: '#062028',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 22px rgba(76,217,210,0.35), inset 0 1px 0 rgba(255,255,255,0.35)',
            }}
          >
            Log workout
          </button>
        </div>
      </div>
    </div>
  )
}
