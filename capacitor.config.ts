import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard'

// Capacitor wraps the built web app (`dist/`) as native iOS + Android apps.
//
// NOTE on identifiers:
// - `appId` below is the canonical/Android applicationId. It is clean reverse-DNS
//   and valid as a Java package name.
// - The iOS target intentionally uses a DIFFERENT bundle id, `v0.2.Taymur.FastDiet`,
//   set in the Xcode project (PRODUCT_BUNDLE_IDENTIFIER). That must match the app
//   already live on the App Store so new builds ship as an UPDATE to that listing,
//   not a new app. Do not "fix" it to match appId.
const config: CapacitorConfig = {
  appId: 'com.taymur.fastdiet',
  appName: 'FastDiet',
  webDir: 'dist',
  ios: {
    // WKWebView paints its own background before the web app's first frame.
    // Matching the app canvas removes the white flash between the launch image
    // and first paint. Also used as the keyboard backdrop (see below).
    backgroundColor: '#07111A',
    // NOTE: deliberately NOT setting `limitsNavigationsToAppBoundDomains`.
    // It looks like free hardening for a fully-local app, but app-bound domains
    // also restrict fetch/XHR, and src/lightning.ts calls out to getalby.com to
    // resolve a Lightning invoice. Turning it on silently breaks tipping.
    //
    // `contentInset` is likewise left at its default: the app already draws its
    // own insets with env(safe-area-inset-*) and renders correctly full-bleed.
  },
  experimental: {
    ios: {
      spm: {
        // `cap sync` reads IPHONEOS_DEPLOYMENT_TARGET out of project.pbxproj and
        // writes it into CapApp-SPM/Package.swift as `.iOS(.vNN)`. With the app
        // at iOS 27 that emits `.v27`, which PackageDescription gates behind
        // `@available(_PackageDescription 6.4)` — so the default tools version of
        // 5.9 fails the build with "'v27' is unavailable".
        //
        // Capacitor flags Swift 6 as not-officially-supported. It is safe here
        // because the only source file in that package is a one-line shim
        // (`public let isCapacitorApp = true`); the Capacitor dependency carries
        // its own manifest and language mode, unaffected by this setting.
        swiftToolsVersion: '6.4',
      },
    },
  },
  plugins: {
    Keyboard: {
      // `native` resizes the whole webview, so 100dvh becomes the area above
      // the keyboard and bottom-anchored CTAs ride up with it.
      resize: KeyboardResize.Native,
      // The app is dark-only. Without this, iOS shows a light keyboard against
      // the dark UI, because `color-scheme: dark` alone doesn't reach it.
      style: KeyboardStyle.Dark,
      // Tint the strip behind the keyboard with `ios.backgroundColor` above.
      autoBackdropColor: 'auto',
    },
  },
}

export default config
