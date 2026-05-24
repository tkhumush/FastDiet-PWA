import { useState } from 'react'
import { CTA } from './shared/CTA'
import { Eyebrow } from './shared/Eyebrow'

interface Props {
  deferredPrompt: any
  onDone: () => void
}

const TK = {
  bg: 'radial-gradient(120% 60% at 50% -10%, rgba(76,217,210,0.20), rgba(76,217,210,0.03) 38%, transparent 65%), radial-gradient(120% 60% at 50% 110%, rgba(240,138,110,0.10), transparent 60%), #07111A',
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
  hairline: 'rgba(255,255,255,0.07)',
  surface: 'rgba(255,255,255,0.04)',
  teal: '#4CD9D2',
}

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <rect x="3" y="8" width="14" height="10" rx="2" />
      <polyline points="7,5 10,2 13,5" />
      <line x1="10" y1="2" x2="10" y2="13" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <circle cx="10" cy="4.5" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="10" cy="15.5" r="1.6" />
    </svg>
  )
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      padding: '14px 16px',
      borderRadius: 14,
      background: TK.surface,
      border: `1px solid ${TK.hairline}`,
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'linear-gradient(118deg, #1E9B97 0%, #4CD9D2 60%, #7BEAE3 105%)',
        color: '#062028',
        fontWeight: 700,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {num}
      </div>
      <div style={{ flex: 1, fontSize: 14, color: TK.muted, lineHeight: 1.6, paddingTop: 4 }}>
        {children}
      </div>
    </div>
  )
}

export function InstallPWA({ deferredPrompt, onDone }: Props) {
  const [installing, setInstalling] = useState(false)
  const platform = detectPlatform()

  async function handleNativeInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    onDone()
  }

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

          {/* iOS steps */}
          {platform === 'ios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Step num={1}>
                Make sure you're using <strong style={{ color: TK.text, fontWeight: 600 }}>Safari</strong>
              </Step>
              <Step num={2}>
                Tap the <strong style={{ color: TK.text, fontWeight: 600 }}>Share</strong> button{' '}
                <span style={{ color: TK.teal }}><ShareIcon /></span>{' '}
                at the bottom of the screen
              </Step>
              <Step num={3}>
                Tap <strong style={{ color: TK.text, fontWeight: 600 }}>"Add to Home Screen"</strong>,
                then tap <strong style={{ color: TK.text, fontWeight: 600 }}>"Add"</strong>
              </Step>
            </div>
          )}

          {/* Android — native prompt available */}
          {platform === 'android' && deferredPrompt && (
            <div style={{
              padding: '20px 18px',
              borderRadius: 16,
              background: 'rgba(76,217,210,0.06)',
              border: '1px solid rgba(76,217,210,0.18)',
            }}>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: TK.muted, lineHeight: 1.6 }}>
                Your browser is ready to install FastDiet as an app with one tap.
              </p>
              <CTA size="md" onClick={handleNativeInstall} disabled={installing}>
                {installing ? 'Installing…' : 'Install FastDiet'}
              </CTA>
            </div>
          )}

          {/* Android — manual fallback */}
          {platform === 'android' && !deferredPrompt && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Step num={1}>
                Make sure you're using <strong style={{ color: TK.text, fontWeight: 600 }}>Chrome</strong>
              </Step>
              <Step num={2}>
                Tap the <strong style={{ color: TK.text, fontWeight: 600 }}>menu</strong>{' '}
                <span style={{ color: TK.teal }}><DotsIcon /></span>{' '}
                in the top-right corner
              </Step>
              <Step num={3}>
                Tap <strong style={{ color: TK.text, fontWeight: 600 }}>"Add to Home Screen"</strong> or{' '}
                <strong style={{ color: TK.text, fontWeight: 600 }}>"Install app"</strong>, then{' '}
                <strong style={{ color: TK.text, fontWeight: 600 }}>"Install"</strong>
              </Step>
            </div>
          )}

          {/* Desktop */}
          {platform === 'desktop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Step num={1}>
                Look for the <strong style={{ color: TK.text, fontWeight: 600 }}>install icon</strong> (⊕) in
                your browser's address bar
              </Step>
              <Step num={2}>
                Or open the browser menu and select{' '}
                <strong style={{ color: TK.text, fontWeight: 600 }}>"Install FastDiet"</strong>
              </Step>
            </div>
          )}
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
