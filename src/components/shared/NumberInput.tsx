import { useState } from 'react'

interface Props {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  showRange?: boolean
  suffix?: string
  ariaLabel?: string
}

const TEXT = '#F4F8F8'
const MUTED = 'rgba(244,248,248,0.55)'
const DIM = 'rgba(244,248,248,0.32)'
const HAIRLINE = 'rgba(255,255,255,0.07)'

function decimalsFor(step: number): number {
  if (step >= 1) return 0
  return Math.max(0, -Math.floor(Math.log10(step)))
}

// A typed numeric field. Replaces the drag slider for precise entry. Keeps a
// local string while focused so partial input ("", "7", "7.") is never fought
// by re-renders, then clamps and normalises on blur.
export function NumberInput({ value, min, max, step = 1, onChange, showRange = false, suffix, ariaLabel }: Props) {
  const prec = decimalsFor(step)
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(() => value.toFixed(prec))
  const [lastValue, setLastValue] = useState(value)

  // Reflect external value changes (e.g. quick buttons, unit toggles) unless
  // the user is actively typing. Adjusting state during render is React's
  // recommended pattern here, avoiding a setState-in-effect cascade.
  if (!focused && value !== lastValue) {
    setLastValue(value)
    setText(value.toFixed(prec))
  }

  function handleInput(raw: string) {
    setText(raw)
    const n = parseFloat(raw)
    if (!Number.isNaN(n)) onChange(n)
  }

  function commit() {
    setFocused(false)
    const n = parseFloat(text)
    if (Number.isNaN(n)) {
      setText(value.toFixed(prec))
      return
    }
    const clamped = Math.max(min, Math.min(max, n))
    const norm = +clamped.toFixed(prec)
    onChange(norm)
    setText(norm.toFixed(prec))
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          border: `1px solid ${focused ? 'rgba(76,217,210,0.5)' : HAIRLINE}`,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 14,
          padding: '12px 16px',
          transition: 'border-color 0.15s ease',
        }}
      >
        <input
          type="text"
          inputMode="decimal"
          value={text}
          aria-label={ariaLabel}
          onChange={e => handleInput(e.target.value)}
          onFocus={e => { setFocused(true); e.target.select() }}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: TEXT,
            fontSize: 22,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'inherit',
            letterSpacing: '-0.02em',
            padding: 0,
          }}
        />
        {suffix && <span style={{ fontSize: 14, color: MUTED, fontWeight: 500, flexShrink: 0 }}>{suffix}</span>}
      </div>
      {showRange && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: DIM, fontVariantNumeric: 'tabular-nums' }}>{+min.toFixed(prec)}</span>
          <span style={{ fontSize: 10, color: DIM, fontVariantNumeric: 'tabular-nums' }}>{+max.toFixed(prec)}</span>
        </div>
      )}
    </div>
  )
}
