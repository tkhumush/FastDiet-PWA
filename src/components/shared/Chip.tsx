import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  textInput?: boolean
}

export function Chip({ children, active = false, onClick, textInput = false }: Props) {
  const TK_HAIRLINE = 'rgba(255,255,255,0.07)'
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-block',
        padding: '4px 13px',
        margin: '0 2px',
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        background: active
          ? 'linear-gradient(180deg, rgba(76,217,210,0.26), rgba(30,155,151,0.16))'
          : 'rgba(255,255,255,0.04)',
        boxShadow: active
          ? 'inset 0 0 0 1.5px rgba(76,217,210,0.65), 0 0 24px rgba(76,217,210,0.22)'
          : textInput
            ? `inset 0 0 0 1px ${TK_HAIRLINE}, inset 0 -2px 0 rgba(76,217,210,0.25)`
            : `inset 0 0 0 1px ${TK_HAIRLINE}`,
        color: '#F4F8F8',
        fontWeight: 600,
        fontSize: 'inherit',
        lineHeight: 'inherit',
        fontVariantNumeric: 'tabular-nums',
        position: 'relative',
        whiteSpace: 'nowrap',
        transition: 'all 0.25s',
      }}
    >
      {children}
      {active && (
        <span
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: 9,
            height: 9,
            borderRadius: 999,
            background: '#F08A6E',
            boxShadow: '0 0 12px rgba(240,138,110,0.9)',
            animation: 'fd-dot 1.6s ease-in-out infinite',
          }}
        />
      )}
    </button>
  )
}
