import { CTA } from './shared/CTA'
import { Eyebrow } from './shared/Eyebrow'
import { InstallSteps } from '../lib/installInstructions'
import { detectPlatform, type BeforeInstallPromptEvent } from '../lib/platform'

interface Props {
  deferredPrompt: BeforeInstallPromptEvent | null
  onDone: () => void
}

const TK = {
  bg: 'radial-gradient(120% 60% at 50% -10%, rgba(76,217,210,0.20), rgba(76,217,210,0.03) 38%, transparent 65%), radial-gradient(120% 60% at 50% 110%, rgba(240,138,110,0.10), transparent 60%), #07111A',
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
}

export function InstallPWA({ deferredPrompt, onDone }: Props) {
  const platform = detectPlatform()

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: TK.bg,
      color: TK.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      position: 'relative',
    }}>
      <div style={{ overflow: 'auto', minHeight: '100dvh' }}>
        <div style={{
          paddingTop: 'calc(60px + env(safe-area-inset-top))',
          paddingBottom: 180,
          paddingLeft: 24,
          paddingRight: 24,
          maxWidth: 480,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>

          {/* App icon */}
          <img
            src="/Appicon.png"
            alt="FastDiet"
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              marginBottom: 24,
              display: 'block',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          />

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <Eyebrow>One more thing</Eyebrow>
            <h1 style={{
              margin: '10px 0 10px',
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color: TK.text,
            }}>
              Add to your<br />home screen
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: TK.muted, lineHeight: 1.6 }}>
              FastDiet works best as an app — full screen, instant launch, and offline.
            </p>
          </div>

          <InstallSteps platform={platform} deferredPrompt={deferredPrompt} onAfterInstall={onDone} />
        </div>
      </div>

      {/* Pinned bottom CTA */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(28px + env(safe-area-inset-bottom))',
        left: 24,
        right: 24,
        maxWidth: 432,
        margin: '0 auto',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <CTA onClick={onDone}>Got it</CTA>
        <button
          onClick={onDone}
          style={{
            background: 'none',
            border: 'none',
            color: TK.muted,
            fontSize: 14,
            padding: '10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'center',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
