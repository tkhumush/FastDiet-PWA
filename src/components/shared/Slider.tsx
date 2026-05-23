import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

interface Props {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  showRange?: boolean
}

export function Slider({ value, min, max, step = 1, onChange, showRange = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  function handle(clientX: number) {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = min + p * (max - min)
    const snapped = Math.round(raw / step) * step
    const clamped = Math.max(min, Math.min(max, snapped))
    // Avoid floating-point dust for sub-integer steps
    const precision = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0
    const final = precision > 0 ? +clamped.toFixed(precision) : clamped
    onChange(final)
  }

  function onDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault()
    handle(e.clientX)
    const move = (ev: PointerEvent) => handle(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const pct = ((value - min) / (max - min)) * 100
  const HAIRLINE = 'rgba(255,255,255,0.07)'
  const DIM = 'rgba(244,248,248,0.32)'

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={trackRef}
        onPointerDown={onDown}
        style={{
          position: 'relative',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 6,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
            border: `1px solid ${HAIRLINE}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -1,
              bottom: -1,
              left: -1,
              width: `calc(${pct}% + 2px)`,
              background: 'linear-gradient(90deg, #1E9B97 0%, #4CD9D2 65%, #7BEAE3 100%)',
              borderRadius: 8,
              boxShadow: '0 0 18px rgba(76,217,210,0.42)',
              transition: 'width 0.05s linear',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${pct}%`,
            transform: 'translate(-50%,-50%)',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 0 0 5px rgba(76,217,210,0.18), 0 4px 14px rgba(0,0,0,0.55)',
            animation: 'fd-thumb 2.6s ease-in-out infinite',
            pointerEvents: 'none',
            transition: 'left 0.05s linear',
          }}
        />
      </div>
      {showRange && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: DIM, fontVariantNumeric: 'tabular-nums' }}>{min}</span>
          <span style={{ fontSize: 10, color: DIM, fontVariantNumeric: 'tabular-nums' }}>{max}</span>
        </div>
      )}
    </div>
  )
}
