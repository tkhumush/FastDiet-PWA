import type { CapacitorConfig } from '@capacitor/cli'

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
}

export default config
