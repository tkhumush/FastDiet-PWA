import { useState } from 'react'
import type { UserProfile, Sex, Units } from '../types'
import { bmrPerHour } from '../fastingMath'
import { Chip } from './shared/Chip'
import { NumberInput } from './shared/NumberInput'
import { WeightInput } from './shared/WeightInput'
import { HeightInput } from './shared/HeightInput'
import { Segmented } from './shared/Segmented'
import { ScrubberCard } from './shared/ScrubberCard'
import { CTA } from './shared/CTA'
import { Eyebrow } from './shared/Eyebrow'

interface Props {
  onSave: (profile: UserProfile) => void
}

type ChipKey = 'name' | 'sex' | 'age' | 'height' | 'weight' | null

const TK = {
  bg: 'radial-gradient(120% 60% at 50% -10%, rgba(76,217,210,0.20), rgba(76,217,210,0.03) 38%, transparent 65%), radial-gradient(120% 60% at 50% 110%, rgba(240,138,110,0.10), transparent 60%), #07111A',
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
  hairline: 'rgba(255,255,255,0.07)',
  teal: '#4CD9D2',
}

export function Onboarding({ onSave }: Props) {
  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('female')
  const [age, setAge] = useState(30)
  const [units, setUnits] = useState<Units>('metric')
  const [heightCm, setHeightCm] = useState(170)
  const [targetKg, setTargetKg] = useState(70)
  const [active, setActive] = useState<ChipKey>(null)

  function save() {
    const profile: UserProfile = {
      name,
      sex,
      age,
      heightCm,
      targetWeightKg: targetKg,
      units,
      bankedCalories: 0,
      cumulativeBankedCalories: 0,
      lastActivityBankDate: null,
      lastWeeklyCheckInDate: null,
    }
    onSave(profile)
  }

  const heightDisplay = units === 'metric'
    ? `${heightCm} cm`
    : (() => { const t = Math.round(heightCm / 2.54); return `${Math.floor(t / 12)}′ ${t % 12}″` })()
  const weightDisplay = units === 'metric'
    ? `${targetKg} kg`
    : `${Math.round(targetKg * 2.20462)} lb`

  let scrubber: React.ReactNode = null
  if (active === 'name') {
    scrubber = (
      <ScrubberCard label="Name" visible onClose={() => setActive(null)}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${TK.hairline}`,
            fontSize: 19,
            color: TK.text,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {['Friend', 'Sarah', 'Alex', 'Jamie'].map(preset => (
            <button
              key={preset}
              onClick={() => setName(preset)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: name === preset ? 'rgba(76,217,210,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${name === preset ? 'rgba(76,217,210,0.4)' : TK.hairline}`,
                color: name === preset ? TK.teal : TK.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </ScrubberCard>
    )
  } else if (active === 'sex') {
    scrubber = (
      <ScrubberCard label="Sex" visible onClose={() => setActive(null)}>
        <Segmented
          options={['Female', 'Male']}
          selected={sex === 'male' ? 'Male' : 'Female'}
          onChange={o => setSex(o.toLowerCase() as Sex)}
        />
      </ScrubberCard>
    )
  } else if (active === 'age') {
    scrubber = (
      <ScrubberCard label="Age" displayValue={age} visible onClose={() => setActive(null)}>
        <NumberInput value={age} min={15} max={90} onChange={setAge} suffix="yrs" showRange />
      </ScrubberCard>
    )
  } else if (active === 'height') {
    const dv = units === 'metric'
      ? heightCm
      : (() => { const t = Math.round(heightCm / 2.54); return `${Math.floor(t / 12)}′${t % 12}″` })()
    const unitLabel = units === 'metric' ? 'cm' : ''
    scrubber = (
      <ScrubberCard
        label="Height"
        displayValue={
          <span>{dv}{unitLabel && <span style={{ fontSize: 16, color: TK.muted, marginLeft: 6, fontWeight: 500 }}>{unitLabel}</span>}</span>
        }
        visible
        onClose={() => setActive(null)}
      >
        <HeightInput valueCm={heightCm} onChangeCm={setHeightCm} units={units} />
        <div style={{ marginTop: 14 }}>
          <Segmented
            options={['cm', 'ft / in']}
            selected={units === 'metric' ? 'cm' : 'ft / in'}
            onChange={o => setUnits(o === 'cm' ? 'metric' : 'imperial')}
            dense
          />
        </div>
      </ScrubberCard>
    )
  } else if (active === 'weight') {
    const dv = units === 'metric' ? targetKg : Math.round(targetKg * 2.20462)
    const unitLabel = units === 'metric' ? 'kg' : 'lb'
    const dailyBurn = bmrPerHour(sex, age, heightCm, targetKg) * 24
    scrubber = (
      <ScrubberCard
        label="Target weight"
        displayValue={
          <span>{dv}<span style={{ fontSize: 16, color: TK.muted, marginLeft: 6, fontWeight: 500 }}>{unitLabel}</span></span>
        }
        visible
        onClose={() => setActive(null)}
      >
        <WeightInput valueKg={targetKg} onChangeKg={setTargetKg} units={units} minKg={30} maxKg={200} />
        <div style={{ marginTop: 14 }}>
          <Segmented
            options={['kg', 'lb']}
            selected={units === 'metric' ? 'kg' : 'lb'}
            onChange={o => setUnits(o === 'kg' ? 'metric' : 'imperial')}
            dense
          />
        </div>
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 12,
            color: TK.muted,
            lineHeight: 1.5,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(76,217,210,0.06)',
            border: '1px solid rgba(76,217,210,0.18)',
          }}
        >
          <span style={{ color: TK.teal, fontWeight: 600 }}>
            ≈ {Math.round(dailyBurn)} cal/day
          </span> — your future-self burn rate.
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
            paddingTop: 70,
            paddingBottom: scrubber ? 340 : 130,
            paddingLeft: 24,
            paddingRight: 24,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <Eyebrow>About me</Eyebrow>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: TK.muted, lineHeight: 1.5 }}>
              Tap any value to scrub. No keyboard.
            </p>
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              lineHeight: 1.7,
              letterSpacing: '-0.015em',
              color: TK.muted,
              padding: '4px 0',
            }}
          >
            I'm&nbsp;
            <Chip active={active === 'name'} onClick={() => setActive(active === 'name' ? null : 'name')} textInput>
              {name || 'add name'}
            </Chip>
            , a&nbsp;
            <Chip active={active === 'sex'} onClick={() => setActive(active === 'sex' ? null : 'sex')}>{sex}</Chip>
            ,&nbsp;
            <Chip active={active === 'age'} onClick={() => setActive(active === 'age' ? null : 'age')}>{age}</Chip>
            &nbsp;years old,&nbsp;
            <Chip active={active === 'height'} onClick={() => setActive(active === 'height' ? null : 'height')}>{heightDisplay}</Chip>
            &nbsp;tall, aiming for&nbsp;
            <Chip active={active === 'weight'} onClick={() => setActive(active === 'weight' ? null : 'weight')}>{weightDisplay}</Chip>
            .
          </div>
        </div>
      </div>

      {/* Pinned bottom scrubber + CTA */}
      <div
        style={{
          position: 'fixed',
          bottom: 38,
          left: 24,
          right: 24,
          maxWidth: 432, /* 480 - 24*2 */
          margin: '0 auto',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          pointerEvents: 'none',
        }}
      >
        {scrubber && <div style={{ pointerEvents: 'auto' }}>{scrubber}</div>}
        <div style={{ pointerEvents: 'auto' }}>
          <CTA warm={active === 'weight'} onClick={save}>
            {active === 'weight' ? 'Start fasting →' : (active ? 'Looks right →' : 'Continue →')}
          </CTA>
        </div>
      </div>
    </div>
  )
}
