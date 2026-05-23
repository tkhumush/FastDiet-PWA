import type { ReactNode } from 'react'
import { Eyebrow } from './Eyebrow'

interface ActionBtn {
  label: string
  onClick: () => void
}

interface Props {
  label: string
  displayValue?: ReactNode
  visible?: boolean
  onClose?: () => void
  primary?: ActionBtn
  secondary?: ActionBtn
  danger?: ActionBtn
  children?: ReactNode
}

export function ScrubberCard({
  label,
  displayValue,
  visible = true,
  onClose,
  primary,
  secondary,
  danger,
  children,
}: Props) {
  const TEXT = '#F4F8F8'
  const MUTED = 'rgba(244,248,248,0.55)'
  const CORAL = '#F08A6E'
  const HAIRLINE = 'rgba(255,255,255,0.07)'

  return (
    <div
      style={{
        padding: '16px 18px 18px',
        borderRadius: 20,
        background: 'rgba(8,14,18,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${HAIRLINE}`,
        boxShadow: '0 0 36px rgba(76,217,210,0.14), 0 -10px 32px rgba(0,0,0,0.55)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.28s ease, transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          gap: 12,
        }}
      >
        <Eyebrow color={CORAL} size={10}>● Editing · {label}</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          {displayValue !== undefined && (
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: TEXT,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.025em',
                lineHeight: 1,
              }}
            >
              {displayValue}
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${HAIRLINE}`,
                color: MUTED,
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'inherit',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {children}

      {(primary || secondary || danger) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
          {danger && (
            <button
              onClick={danger.onClick}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(240,138,110,0.08)',
                border: '1px solid rgba(240,138,110,0.35)',
                color: CORAL,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {danger.label}
            </button>
          )}
          <div style={{ flex: 1 }} />
          {secondary && (
            <button
              onClick={secondary.onClick}
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                background: 'transparent',
                border: `1px solid ${HAIRLINE}`,
                color: MUTED,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {secondary.label}
            </button>
          )}
          {primary && (
            <button
              onClick={primary.onClick}
              style={{
                padding: '12px 22px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(120deg, #1E9B97 0%, #4CD9D2 60%, #7BEAE3 105%)',
                backgroundSize: '180% 180%',
                animation: 'fd-shimmer 6s ease-in-out infinite alternate',
                color: '#062028',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 6px 20px rgba(76,217,210,0.35)',
              }}
            >
              {primary.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
