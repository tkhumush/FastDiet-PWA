import type { ReactNode, CSSProperties } from 'react'

interface Props {
  children: ReactNode
  color?: string
  size?: number
  style?: CSSProperties
}

export function Eyebrow({ children, color = '#4CD9D2', size = 11, style }: Props) {
  return (
    <span
      style={{
        fontSize: size,
        color,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
