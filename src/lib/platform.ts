// Pure platform/install helpers shared across components. Kept separate from
// the .tsx install-instructions so that file only exports components (keeps
// React Fast Refresh happy).

export type Platform = 'ios' | 'android' | 'desktop'

export function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

// The non-standard `beforeinstallprompt` event (Chromium). Minimal typing so we
// avoid `any` while only relying on the members we actually use.
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}
