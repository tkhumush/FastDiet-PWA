interface Props {
  /** Drop in a real screenshot later, e.g. "/screenshots/dashboard.png". */
  src?: string
  alt: string
  caption?: string
  width?: number
}

// A phone-shaped frame for landing-page screenshots. Renders a real image when
// `src` is provided; otherwise a styled placeholder so the page looks complete
// before real screenshots exist.
export function DeviceMockup({ src, alt, caption, width = 230 }: Props) {
  const height = Math.round(width * (19.5 / 9))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      <div
        style={{
          width,
          height,
          borderRadius: 34,
          padding: 8,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
          border: '1px solid var(--fd-hairline)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 40px rgba(76,217,210,0.10)',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 70,
            height: 6,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 2,
          }}
        />
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 27,
            overflow: 'hidden',
            background: 'var(--fd-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {src ? (
            <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <span
              style={{
                color: 'var(--fd-dim)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textAlign: 'center',
                padding: '0 18px',
              }}
            >
              {caption ?? alt}
            </span>
          )}
        </div>
      </div>
      {caption && (
        <span style={{ fontSize: 12.5, color: 'var(--fd-muted)', fontWeight: 500 }}>{caption}</span>
      )}
    </div>
  )
}
