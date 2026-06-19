# FastDiet PWA — Feature Parity Analysis

> ⚠️ **Superseded in part (2026-06-19).** This document analyzes the PWA as a *standalone
> web app* with native iOS kept separate. The decided strategy is now a **single PWA
> codebase shipped to three targets (PWA / iOS / Android) via Capacitor** — see
> [ROADMAP.md](./ROADMAP.md). Under Capacitor, several items below marked "❌ NOT possible
> in a PWA" (HealthKit, notifications, StoreKit/IAP, Siri/App Intents) become achievable
> again through native plugins. Treat the ❌ section as "not possible in a *plain* PWA,"
> not as a limitation of the project.

## Summary

The core diet logic (BMR calculation, FIFO fast tracking, calorie bank, weight tracker) translates directly to a PWA. The three things that **cannot** be replicated are HealthKit integration, the home-screen widget, and reliable background refresh. Everything else is achievable — some with minor UX trade-offs.

---

## ✅ Features that port cleanly to PWA

| iOS Feature | PWA Equivalent | Notes |
|---|---|---|
| Onboarding (name, sex, age, height, target weight) | HTML form | Identical UX |
| Profile editing | HTML form | Identical |
| BMR calculation (Roza & Shizgal) | Ported to TypeScript | Bit-for-bit identical |
| FIFO fast tracking & `summarize()` | Ported to TypeScript | Same algorithm |
| Dashboard — calorie countdown | React + `setInterval(1s)` | Same live tick |
| Dashboard — "next meal at" projection | JS Date math | Same |
| Animated water-fill background | Canvas + `requestAnimationFrame` | Same dual-wave, same color shift |
| Log meal (calories, name, photo) | `<input type="file" capture>` | Camera + library both work |
| Calorie bank choice (Use / Melt) | Modal sheet | Same logic |
| Calorie Bank → weight milestone | State / IndexedDB | Same |
| Energy log (list of meals) | List + edit/delete | Same |
| Per-meal donut burn ring | SVG circle | Same visual |
| Weight tracker — manual log | `<input type="number">` | Works fine |
| Weight chart (1M/3M/6M/1Y/All) | Recharts `LineChart` | Same range picker |
| BMR Journey projection chart | Recharts | Same math |
| Melted milestone / Bank management | State + IndexedDB | Same |
| Weekly check-in (Friday prompt) | JS `Date.getDay()` | Same trigger logic |
| Metric / imperial unit toggle | State | Identical |
| Persistent local storage | IndexedDB via `idb` | Equivalent to SwiftData |
| Offline use | Service Worker (Workbox) | Works after first load |

---

## ⚠️ Features possible with caveats

| iOS Feature | PWA Status | Caveat |
|---|---|---|
| **Push notifications ("Fast complete")** | Possible | Requires user to **Add to Home Screen** on iOS (Safari 16.4+). Android works without that. Not available in in-browser PWA on iOS. |
| **Photo from camera** | Possible | Uses `<input capture="environment">`. Less polished than native camera sheet; no live viewfinder overlay. |
| **Haptic feedback** | Not on iOS | `navigator.vibrate()` is blocked by iOS Safari. Works on Android. |
| **Manual activity logging** | Possible (manual entry) | No auto-sync from any fitness source. User must type the number. Implemented as a prompt in the dashboard. |

---

## ❌ Features NOT possible in a PWA

### 1. HealthKit Integration
This is the biggest loss. HealthKit is an Apple-native framework — there is no Web API equivalent.

**Specific things lost:**
- **Active energy burned auto-sync** — the app polls HealthKit every 30 seconds during a fast to reduce calories owed. In the PWA, users must manually enter activity calories.
- **Workout read** — HealthKit workout sessions (run, walk, cycle, etc.) cannot be read. The Energy Log workout rows are gone.
- **Weight read from HealthKit** — The iOS app pre-fills weight data from Apple Health and smart scales. The PWA is manual-entry only.
- **Weight write to HealthKit** — The iOS app saves logged weights back to Apple Health so other apps see them. The PWA stores weights in IndexedDB only (isolated from the Apple ecosystem).
- **Profile prefill (age, sex, height) from HealthKit** — The "Use Apple Health" button on onboarding disappears. Users type everything manually.

**No workaround exists.** HealthKit requires a signed, sandboxed native app and explicit user entitlements. It is not exposed to the web platform.

### 2. Home-screen Widget (WidgetKit)
Widgets on iOS and iPadOS are powered by WidgetKit, which is exclusive to native apps. There is no PWA equivalent — you cannot inject content onto the iOS home screen or lock screen from a web app.

### 3. Reliable Background Refresh
The iOS app uses a background task to refresh HealthKit active energy every 30 seconds while a fast is active. Service Workers in iOS Safari have a very restricted execution budget and no persistent background access. The PWA only updates when the screen is open and active.

### 4. StoreKit / App Store In-App Purchases
The $1 tip jar is a StoreKit transaction. PWAs cannot access StoreKit. A web alternative (Stripe, etc.) could replace it but App Store IAP is unavailable.

### 5. System-level Integration
- Siri shortcuts
- Spotlight search
- Share Sheet extension
- Handoff / Continuity
- App Clips

---

## Architecture decisions for the PWA

| Concern | Decision |
|---|---|
| Persistence | IndexedDB via `idb` — structured, offline, no 5 MB cookie limit |
| Offline | Workbox service worker, pre-caches all assets on first load |
| Charts | Recharts (Recharts uses SVG — works in all browsers, no canvas flicker) |
| Water fill animation | HTML Canvas + `requestAnimationFrame` — same dual-wave as iOS |
| State | React hooks + IndexedDB — no external state library needed at this scale |
| PWA manifest | `vite-plugin-pwa` — generates SW + manifest, handles cache versioning |

---

## What the PWA is ideal for

- **Android users** — gets 100% of the UX including push notifications and vibration, at no App Store fee.
- **Web-first testing** — onboard and log meals on desktop before deciding to download the native app.
- **Cross-platform reach** — Windows, Linux, Chromebook all work.

## What still requires the native iOS app

- Any user who wants HealthKit workout sync for accurate "calories owed" tracking
- Any user who wants the home-screen widget
- Any user who uses Apple Health as their fitness source of truth
