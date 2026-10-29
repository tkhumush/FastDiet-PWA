# FastDiet — Direction & Roadmap

> **Status as of 2026-06-19.** This is the forward-looking plan. For the historical
> iOS-vs-PWA parity breakdown, see [FEATURES.md](./FEATURES.md) — but note that several
> of its "not possible in a PWA" conclusions are superseded by the Capacitor strategy below.

## Decision: one codebase, three targets

The PWA (`FastDiet PWA`, React 19 + Vite + TS + IndexedDB) is now the **single source of
truth** for the product. The native Swift app (`FastDiet Current`) is frozen — kept as a
reference for HealthKit / StoreKit / Siri patterns, not developed further.

We ship the same codebase to three targets:

| Target | How |
|---|---|
| **PWA** | Vite build + `vite-plugin-pwa` service worker/manifest (current). |
| **iOS** | Capacitor native shell wrapping the built web app. |
| **Android (APK)** | Same Capacitor shell, Android target. |

### Why this over maintaining native iOS separately
- Feature parity by construction — one implementation, not two kept in sync by hand.
- Android comes essentially for free.
- The existing App Store listing can be **updated in place** (same bundle id) with the
  Capacitor binary — no need to delete the app or start a new listing. (Confirm the live
  bundle id; the Xcode project currently shows `v0.2.Taymur.FastDiet`.)

### Native capabilities via Capacitor plugins (re-enabled vs. plain PWA)
- **HealthKit / Health Connect** — `@perfood/capacitor-healthkit` or `capacitor-health`
  (active energy, body mass, height; Android maps to Health Connect).
- **Notifications** — `@capacitor/local-notifications` (e.g. "fast complete"), `@capacitor/push-notifications`.
- **In-app purchases** — RevenueCat Capacitor plugin (replaces StoreKit tip jar).
- **Open risk:** background active-energy refresh *during a fast* (the native app polls
  every ~30s) is the weakest spot in a webview and likely needs a small custom native
  plugin / background task. Validate this early.

## AI roadmap (cross-platform: iOS + Android)

The headline differentiator going forward. Two flows:

### 1. Meal photo → AI calorie estimate
User snaps a photo of their meal; AI estimates calories (and ideally identifies the food)
and pre-fills the Log Meal flow.
- **Cross-platform baseline:** send the image to a vision model via API for estimation.
- **On-device option (iOS):** Apple's on-device **Foundation Models** framework
  (introduced iOS 26) for private, offline estimation where feasible; fall back to cloud
  for harder cases.
- Surfaces in the existing `LogMealModal` / `<input capture>` photo flow.

### 2. Voice / assistant auto-logging — "log a meal without opening the app"
Goal: "Hey Siri, add a 600-calorie meal that I ate at noon" → meal logged, no app launch.
- **iOS:** expose **App Intents** + Siri (and Apple Intelligence) from the Capacitor
  native shell so the meal-logging action is callable by voice / Shortcuts / Spotlight.
  Requires a custom native bridge — Capacitor's webview doesn't register App Intents on
  its own. Mirror the patterns in the frozen Swift app where useful.
- **Android:** equivalent via App Actions / Google Assistant / Gemini intents.
- Both write into the same meal store (IndexedDB / synced store) the app already uses.

### Implementation notes / open questions
- App Intents and background health refresh both need native-shell code, not just web —
  budget for a thin layer of Swift/Kotlin inside the Capacitor project.
- Decide cloud vs. on-device per flow based on privacy, latency, and cost.
- Keep AI calorie estimates as *editable suggestions*, never silent commits.

## App identifiers (decided 2026-06-19)
- **iOS bundle id:** `v0.2.Taymur.FastDiet` — set in `ios/App/App.xcodeproj` to match the
  app already live on the App Store, so Capacitor builds ship as an UPDATE to that listing,
  not a new app. Do not change it.
- **Android applicationId / Capacitor `appId`:** `com.taymur.fastdiet` — clean reverse-DNS
  (the iOS id is invalid as an Android package). No Android app is published yet, so this is
  a safe permanent choice. Android applicationId is immutable once on the Play Store.

## Native build: process & gotchas (iOS verified booting on iOS 27 sim, 2026-06-19)

**Build command for native:** `npm run build:native` (sets `CAP_BUILD=1`), then `npx cap sync`.
Do NOT use plain `npm run build` for native — see service-worker note below.

Fixes applied to get the Capacitor shell running on the iOS 27 simulator:
- **UIScene lifecycle (required — was a hard crash).** iOS 26+/27 makes scene adoption
  mandatory; the stock Capacitor `AppDelegate`-only template crashes at launch
  (`EXC_BREAKPOINT` in `UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`).
  Fix: `SceneDelegate` class added in `ios/App/App/AppDelegate.swift` (kept in that file so
  it compiles without editing the .xcodeproj — the project uses explicit file membership,
  not Xcode-16 synchronized groups) + `UIApplicationSceneManifest` in `Info.plist` pointing
  at the existing `Main` storyboard. **This will need re-applying if the iOS platform is
  regenerated** (`cap add ios`).
- **No service worker in native builds.** `vite.config.ts` drops `vite-plugin-pwa` when
  `CAP_BUILD=1`. A Workbox SW in the webview serves a stale hashed `index.html` after a
  rebuild → 404s the entry script → blank screen.
- **Strip `crossorigin` from entry tags.** `vite.config.ts` `strip-crossorigin` plugin
  (native only). Vite's `crossorigin` on the module script forces WKWebView into CORS mode
  under `capacitor://localhost`; the scheme handler returns no ACAO header → module refused.

**Simulator screenshot caveat:** `xcrun simctl io screenshot` does NOT capture WKWebView
content reliably when the Simulator GUI app isn't running (it shows blank white/black even
though the app renders fine). Native UIKit captures fine. To verify the webview, run from
Xcode with the Simulator GUI, or read the JS console via the iOS system log
(`log stream` + `WebKitConsoleMessageToSystemConsoleEnabled`). Don't trust headless
screenshots of the webview.

This machine's Xcode 27 is a slim install on the external drive (no Simulator.app GUI, no
CocoaPods — SPM is used so that's fine). Point tools at it with
`DEVELOPER_DIR=/Volumes/Extranl Drive/Applications/Xcode-beta.app/Contents/Developer`, or
run `sudo xcode-select -s` to make it permanent.

## Migration checklist (high level)
1. ✅ Add Capacitor; generate `ios/` (Swift Package Manager) and `android/` projects, gate
   the marketing Landing + install UI out of native (see `Root.tsx` / `App.tsx`), set the
   iOS bundle id for store continuity, and get the iOS app **building + booting into the app
   on the iOS 27 simulator** (verified via JS boot trace). Android project is generated but
   its build/boot is **not yet verified**.
2. Wire HealthKit/Health Connect, local notifications, IAP plugins.
3. Build the AI meal-photo estimation flow.
4. Build App Intents / Assistant voice logging.
5. Ship Capacitor iOS build as an update to the existing App Store listing.
6. Once live and validated, move `FastDiet Current` into `Archive/`.

### Dev workflow reminder
After any web change: `npm run build && npx cap sync` to push the new `dist/` into both
native projects, then open `ios/App/App.xcworkspace` in Xcode or `android/` in Android Studio.
