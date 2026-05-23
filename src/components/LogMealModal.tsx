import { useState, useRef } from 'react'
import type { MealEntry } from '../types'
import { Chip } from './shared/Chip'
import { Slider } from './shared/Slider'
import { ScrubberCard } from './shared/ScrubberCard'
import { Eyebrow } from './shared/Eyebrow'

interface Props {
  onSave: (meal: MealEntry) => void
  onCancel: () => void
  initialCalories?: number
  initialName?: string
  initialPhoto?: string
}

type ChipKey = 'name' | 'cal' | 'time' | 'photo' | null

const TK = {
  bg: 'radial-gradient(120% 60% at 50% -10%, rgba(76,217,210,0.20), rgba(76,217,210,0.03) 38%, transparent 65%), radial-gradient(120% 60% at 50% 110%, rgba(240,138,110,0.10), transparent 60%), #07111A',
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
  dim: 'rgba(244,248,248,0.32)',
  hairline: 'rgba(255,255,255,0.07)',
  teal: '#4CD9D2',
  coral: '#F08A6E',
}

const TIME_PRESETS = [
  { label: 'Now', min: 0 },
  { label: '15m ago', min: 15 },
  { label: '30m ago', min: 30 },
  { label: '1h ago', min: 60 },
  { label: '2h ago', min: 120 },
]

function timeAgoLabel(min: number): string {
  const p = TIME_PRESETS.find(x => x.min === min)
  if (p) return p.label
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h ${m}m ago` : `${h}h ago`
}

export function LogMealModal({ onSave, onCancel, initialCalories = 500, initialName = '', initialPhoto }: Props) {
  const [name, setName] = useState(initialName || 'Lunch')
  const [cal, setCal] = useState(initialCalories)
  const [minAgo, setMinAgo] = useState(0)
  const [photo, setPhoto] = useState<string | undefined>(initialPhoto)
  const [active, setActive] = useState<ChipKey>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  const closeAll = () => setActive(null)

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setPhoto(ev.target?.result as string)
      closeAll()
    }
    reader.readAsDataURL(file)
    // Reset so the same file can be picked again later
    e.target.value = ''
  }

  function handleSave() {
    const trimmed = name.trim()
    const meal: MealEntry = {
      id: crypto.randomUUID(),
      calories: cal,
      loggedAt: new Date(Date.now() - minAgo * 60_000).toISOString(),
      name: trimmed,
      kind: 'meal',
      photoDataUrl: photo,
    }
    onSave(meal)
  }

  let scrubber: React.ReactNode = null
  if (active === 'name') {
    scrubber = (
      <ScrubberCard label="Meal name" visible onClose={closeAll}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Poke bowl"
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
          {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Coffee', 'Smoothie'].map(p => (
            <button
              key={p}
              onClick={() => setName(p)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: name === p ? 'rgba(76,217,210,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${name === p ? 'rgba(76,217,210,0.4)' : TK.hairline}`,
                color: name === p ? TK.teal : TK.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </ScrubberCard>
    )
  } else if (active === 'cal') {
    scrubber = (
      <ScrubberCard
        label="Calories"
        displayValue={
          <span>{cal}<span style={{ fontSize: 14, color: TK.muted, marginLeft: 6, fontWeight: 500 }}>cal</span></span>
        }
        visible
        onClose={closeAll}
      >
        <Slider value={cal} min={50} max={2000} step={10} onChange={setCal} showRange />
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {[200, 400, 600, 800, 1000].map(c => (
            <button
              key={c}
              onClick={() => setCal(c)}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 8,
                background: cal === c ? 'rgba(76,217,210,0.15)' : 'transparent',
                border: `1px solid ${cal === c ? 'rgba(76,217,210,0.4)' : TK.hairline}`,
                color: cal === c ? TK.teal : TK.muted,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </ScrubberCard>
    )
  } else if (active === 'time') {
    scrubber = (
      <ScrubberCard label="When" visible onClose={closeAll}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TIME_PRESETS.map(p => (
            <button
              key={p.min}
              onClick={() => { setMinAgo(p.min); closeAll() }}
              style={{
                flex: '1 0 auto',
                padding: '10px 14px',
                borderRadius: 12,
                background: minAgo === p.min
                  ? 'linear-gradient(180deg, rgba(76,217,210,0.24), rgba(30,155,151,0.16))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${minAgo === p.min ? 'rgba(76,217,210,0.55)' : TK.hairline}`,
                color: minAgo === p.min ? TK.text : TK.muted,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </ScrubberCard>
    )
  } else if (active === 'photo') {
    scrubber = (
      <ScrubberCard label="Photo" visible onClose={closeAll}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => cameraInputRef.current?.click()}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${TK.hairline}`,
              color: TK.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 24 }}>📷</span>
            Camera
          </button>
          <button
            onClick={() => libraryInputRef.current?.click()}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${TK.hairline}`,
              color: TK.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 24 }}>🖼</span>
            Library
          </button>
          {photo && (
            <button
              onClick={() => { setPhoto(undefined); closeAll() }}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(240,138,110,0.08)',
                border: '1px solid rgba(240,138,110,0.35)',
                color: TK.coral,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 24 }}>🗑</span>
              Remove
            </button>
          )}
        </div>
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
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoFile}
        style={{ display: 'none' }}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFile}
        style={{ display: 'none' }}
      />

      <div style={{ height: '100dvh', overflow: 'auto' }}>
        <div
          style={{
            minHeight: '100dvh',
            paddingTop: 60,
            paddingBottom: scrubber ? 340 : 130,
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
            <Eyebrow color={TK.muted} size={11}>Log a meal</Eyebrow>
            <div style={{ width: 32 }} />
          </div>

          {/* Sentence */}
          <div style={{ marginBottom: 18 }}>
            <Eyebrow size={11}>Meal</Eyebrow>
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
              You ate&nbsp;
              <Chip active={active === 'name'} onClick={() => setActive(active === 'name' ? null : 'name')} textInput>
                {name || 'a meal'}
              </Chip>
              ,&nbsp;
              <Chip active={active === 'cal'} onClick={() => setActive(active === 'cal' ? null : 'cal')}>
                {cal} cal
              </Chip>
              &nbsp;at&nbsp;
              <Chip active={active === 'time'} onClick={() => setActive(active === 'time' ? null : 'time')}>
                {timeAgoLabel(minAgo)}
              </Chip>
              .
            </div>
          </div>

          {/* Photo */}
          <div>
            <Eyebrow color={TK.muted} size={10}>Photo · optional</Eyebrow>
            <button
              onClick={() => setActive('photo')}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 10,
                padding: 0,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: 'transparent',
              }}
            >
              {photo ? (
                <div
                  style={{
                    aspectRatio: '16 / 10',
                    borderRadius: 16,
                    background: `url(${photo}) center / cover, linear-gradient(135deg, rgba(76,217,210,0.18), rgba(240,138,110,0.10))`,
                    border: '1px solid rgba(76,217,210,0.28)',
                    overflow: 'hidden',
                  }}
                />
              ) : (
                <div
                  style={{
                    aspectRatio: '16 / 10',
                    borderRadius: 16,
                    background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 8px, rgba(255,255,255,0.05) 8px 16px)',
                    border: `1px dashed ${TK.hairline}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: TK.muted,
                  }}
                >
                  <span style={{ fontSize: 32 }}>📷</span>
                  <span
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 11,
                      letterSpacing: '0.04em',
                    }}
                  >
                    tap to add photo
                  </span>
                </div>
              )}
            </button>
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
              background: 'linear-gradient(120deg, #1E9B97 0%, #4CD9D2 45%, #7BEAE3 75%, #F08A6E 130%)',
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
            Log meal
          </button>
        </div>
      </div>
    </div>
  )
}
