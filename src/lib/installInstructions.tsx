import { useState } from 'react'
import { CTA } from '../components/shared/CTA'
import type { Platform, BeforeInstallPromptEvent } from './platform'

// Shared install guidance used by both the post-onboarding InstallPWA screen
// and the public Landing page, so the instructions stay in one place.

const TK = {
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
  hairline: 'rgba(255,255,255,0.07)',
  surface: 'rgba(255,255,255,0.04)',
  teal: '#4CD9D2',
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

export function Step({ num, children }: { num: number; children: React.ReactNode }) {
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

interface InstallStepsProps {
  platform: Platform
  deferredPrompt: BeforeInstallPromptEvent | null
  onAfterInstall?: () => void
}

// Renders the platform-appropriate install instructions. When the browser has
// offered a native install prompt (Android/desktop Chrome), shows a one-tap
// install button instead of manual steps.
export function InstallSteps({ platform, deferredPrompt, onAfterInstall }: InstallStepsProps) {
  const [installing, setInstalling] = useState(false)

  async function handleNativeInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setInstalling(false)
    onAfterInstall?.()
  }

  if (deferredPrompt && platform !== 'ios') {
    return (
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
    )
  }

  if (platform === 'ios') {
    return (
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
    )
  }

  if (platform === 'android') {
    return (
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
    )
  }

  return (
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
  )
}
