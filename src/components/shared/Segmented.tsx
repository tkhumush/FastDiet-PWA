interface Props {
  options: string[]
  selected: string
  onChange: (option: string) => void
  dense?: boolean
}

export function Segmented({ options, selected, onChange, dense = false }: Props) {
  const TEXT = '#F4F8F8'
  const MUTED = 'rgba(244,248,248,0.55)'
  const HAIRLINE = 'rgba(255,255,255,0.07)'
  return (
    <div
      style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.025)',
        padding: 4,
        borderRadius: 14,
        gap: 4,
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      {options.map(opt => {
        const active = selected === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              padding: dense ? '9px 12px' : '12px 16px',
              borderRadius: 10,
              textAlign: 'center',
              background: active
                ? 'linear-gradient(180deg, rgba(76,217,210,0.24), rgba(30,155,151,0.16))'
                : 'transparent',
              color: active ? TEXT : MUTED,
              fontWeight: active ? 600 : 500,
              fontSize: 14,
              boxShadow: active
                ? 'inset 0 0 0 1.5px rgba(76,217,210,0.55), 0 4px 18px rgba(76,217,210,0.18)'
                : 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
