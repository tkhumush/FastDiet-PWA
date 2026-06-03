import { useEffect, useState } from 'react'
import { CTA } from './shared/CTA'
import { Eyebrow } from './shared/Eyebrow'
import { DeviceMockup } from './DeviceMockup'
import { InstallSteps } from '../lib/installInstructions'
import { detectPlatform, type BeforeInstallPromptEvent } from '../lib/platform'

const APP_PATH = '/app'

function openApp() {
  window.location.assign(APP_PATH)
}

interface Feature {
  emoji: string
  title: string
  body: string
}

const FEATURES: Feature[] = [
  {
    emoji: '🔥',
    title: 'Energy logging that thinks ahead',
    body: 'Log meals and workouts in seconds. FastDiet shows where your day stands against the pace of your future, slimmer self.',
  },
  {
    emoji: '📉',
    title: 'Weight tracking with a real trajectory',
    body: 'See your trend line and a projection to your goal weight — so you know your current pace is actually working.',
  },
  {
    emoji: '⚡',
    title: 'Bank the burn',
    body: 'Turn extra activity into a calorie buffer you can spend later, and watch surplus melt away over time.',
  },
  {
    emoji: '📲',
    title: 'Installs like a native app',
    body: 'Add it to your home screen for full-screen, instant launch, and full offline support. No app store required.',
  },
]

export function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const platform = detectPlatform()

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100dvh',
        background: 'var(--fd-bg)',
        color: 'var(--fd-text)',
        fontFamily: 'var(--fd-font)',
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: '0 24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'calc(20px + env(safe-area-inset-top)) 0 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/Appicon.png"
              alt="FastDiet"
              width={34}
              height={34}
              style={{ borderRadius: 9, display: 'block', boxShadow: '0 4px 14px rgba(0,0,0,0.45)' }}
            />
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>FastDiet</span>
          </div>
          <button
            onClick={openApp}
            style={{
              background: 'none',
              border: '1px solid var(--fd-hairline)',
              color: 'var(--fd-text)',
              fontSize: 14,
              fontWeight: 600,
              padding: '9px 16px',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Open app
          </button>
        </header>

        {/* Hero */}
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 40,
            padding: '48px 0 32px',
          }}
        >
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <Eyebrow>Eat at the rate of your future self</Eyebrow>
            <h1
              style={{
                margin: '16px 0 18px',
                fontSize: 'clamp(34px, 6vw, 52px)',
                lineHeight: 1.08,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                background: 'var(--fd-hero-text)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Lose weight at
              <br />
              the pace of your
              <br />
              future, slimmer self.
            </h1>
            <p
              style={{
                margin: '0 0 28px',
                fontSize: 17,
                lineHeight: 1.6,
                color: 'var(--fd-muted)',
                maxWidth: 460,
              }}
            >
              FastDiet turns your daily eating into a simple, forward-looking pace — log meals and
              workouts, track your weight trend, and see a real projection to your goal.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, maxWidth: 420 }}>
              <div style={{ flex: '1 1 200px' }}>
                <CTA onClick={openApp}>Open FastDiet</CTA>
              </div>
              {deferredPrompt && platform !== 'ios' && (
                <button
                  onClick={() => deferredPrompt.prompt()}
                  style={{
                    flex: '1 1 140px',
                    padding: '17px 24px',
                    borderRadius: 16,
                    border: '1px solid rgba(76,217,210,0.35)',
                    background: 'rgba(76,217,210,0.08)',
                    color: 'var(--fd-teal)',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Install app
                </button>
              )}
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--fd-dim)' }}>
              Free · Works in your browser · Installs to your home screen
            </p>
          </div>

          {/* Hero screenshot */}
          <div style={{ flex: '1 1 240px', display: 'flex', justifyContent: 'center' }}>
            <DeviceMockup
              src="/screenshots/dashboard.png"
              alt="FastDiet dashboard showing calories owed"
              caption="Today at a glance"
              width={250}
            />
          </div>
        </section>

        {/* Screenshot strip */}
        <section style={{ padding: '24px 0' }}>
          <div
            style={{
              display: 'flex',
              gap: 28,
              flexWrap: 'wrap',
              padding: '12px 4px',
              justifyContent: 'center',
            }}
          >
            <DeviceMockup
              src="/screenshots/log.png"
              alt="Energy log screen with logged meals"
              caption="Energy log"
              width={200}
            />
            <DeviceMockup
              src="/screenshots/weight.png"
              alt="Weight tracker with trend and projection to goal"
              caption="Weight & projection"
              width={200}
            />
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '40px 0 16px' }}>
          <Eyebrow color="var(--fd-muted)">What it does</Eyebrow>
          <div
            style={{
              marginTop: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {FEATURES.map(f => (
              <div
                key={f.title}
                style={{
                  padding: '22px 20px',
                  borderRadius: 18,
                  background: 'var(--fd-surface)',
                  border: '1px solid var(--fd-hairline)',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 12 }}>{f.emoji}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--fd-muted)' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to install */}
        <section style={{ padding: '48px 0 16px', maxWidth: 520, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Eyebrow>Get the app</Eyebrow>
            <h2
              style={{
                margin: '12px 0 8px',
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              Add FastDiet to your home screen
            </h2>
            <p style={{ margin: 0, fontSize: 14.5, color: 'var(--fd-muted)', lineHeight: 1.6 }}>
              It installs straight from your browser — no app store, no account.
            </p>
          </div>
          <InstallSteps platform={platform} deferredPrompt={deferredPrompt} />
        </section>

        {/* Final CTA */}
        <section style={{ padding: '40px 0 8px', maxWidth: 360, margin: '0 auto' }}>
          <CTA onClick={openApp}>Open FastDiet</CTA>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: '40px 0 calc(32px + env(safe-area-inset-bottom))',
            textAlign: 'center',
            color: 'var(--fd-dim)',
            fontSize: 13,
          }}
        >
          <p style={{ margin: '0 0 6px', color: 'var(--fd-muted)' }}>
            Eat at the rate of your future, slimmer self.
          </p>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} FastDiet</p>
        </footer>
      </div>
    </div>
  )
}
