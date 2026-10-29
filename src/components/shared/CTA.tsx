import type { ReactNode } from 'react'
import { tapFeedback } from '../../lib/nativeShell'

interface Props {
  children: ReactNode
  warm?: boolean
  size?: 'lg' | 'md'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function CTA({ children, warm = false, size = 'lg', onClick, disabled, type = 'button' }: Props) {
  return (
    <button
      type={type}
      onClick={onClick && (() => { tapFeedback(); onClick() })}
      disabled={disabled}
      style={{
        width: '100%',
        padding: size === 'lg' ? '17px 24px' : '13px 20px',
        borderRadius: 16,
        border: 'none',
        background: warm
          ? 'linear-gradient(118deg, #1E9B97 0%, #4CD9D2 45%, #7BEAE3 75%, #F08A6E 130%)'
          : 'linear-gradient(118deg, #1E9B97 0%, #4CD9D2 60%, #7BEAE3 105%)',
        backgroundSize: '180% 180%',
        animation: 'fd-shimmer 6s ease-in-out infinite alternate',
        color: '#062028',
        fontWeight: 700,
        fontSize: size === 'lg' ? 17 : 15,
        letterSpacing: '0.01em',
        textAlign: 'center',
        boxShadow: '0 10px 32px rgba(76,217,210,0.40), inset 0 1px 0 rgba(255,255,255,0.40)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}
