// Everything that only makes sense inside the Capacitor shell.
//
// The web build imports this too, so every export has to be a no-op in a browser
// rather than a throw — the PWA and the native app run the same bundle.

import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export const isNative = Capacitor.isNativePlatform()

/**
 * One-time shell setup, called before the first React render.
 *
 * Each call is fire-and-forget and individually guarded: a plugin failing on one
 * OS version should degrade that single behaviour, not abort the rest of setup
 * and leave the splash screen up forever.
 */
export async function initNativeShell(): Promise<void> {
  if (!isNative) return

  await Promise.allSettled([
    // Light status-bar text, to sit on the app's dark canvas. (Style.Dark means
    // "light text for dark backgrounds" — it names the background, not the text.)
    StatusBar.setStyle({ style: Style.Dark }),

    // The white form-assistant bar (‹ › Done) is the single most webby thing on
    // screen: it renders light against the dark UI, and it lingers after the
    // keyboard dismisses, covering — and swallowing taps on — the bottom CTA.
    Keyboard.setAccessoryBarVisible({ isVisible: false }),

    SplashScreen.hide(),
  ])
}

/**
 * Short tap feedback for primary controls. Silent on the web, and never awaited
 * by callers — feedback must not sit in front of the action it accompanies.
 */
export function tapFeedback(): void {
  if (!isNative) return
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}
