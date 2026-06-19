import { lazy, Suspense } from 'react'
import { Capacitor } from '@capacitor/core'
import App from './App'
import { isStandalone } from './lib/platform'

// Landing is the public marketing page. It only ever renders in a browser, so
// lazy-load it: this keeps its hero image and other marketing assets out of the
// native iOS/Android bundles entirely.
const Landing = lazy(() =>
  import('./components/Landing').then((m) => ({ default: m.Landing })),
)

// Top-level surface picker (the app's only "router"). Evaluated once per full
// page load — navigation between the landing and the app is a full-page change.
//
// - Native builds (Capacitor iOS/Android) always render App. The webview loads
//   index.html at `/` and is not a "standalone" PWA, so without this guard a
//   wrapped app would boot into the marketing Landing page — never what we want
//   inside an installed native app.
// - The installed PWA launches at `/app` (manifest start_url) and renders App.
// - Existing installs whose cached manifest still has start_url `/` open in
//   standalone mode at `/`; we detect that and render App so they never see the
//   marketing page (no reinstall needed).
// - Everything else in a browser gets the public Landing page.
export default function Root() {
  if (Capacitor.isNativePlatform()) {
    return <App />
  }

  const path = window.location.pathname
  const standalone = isStandalone()

  if (standalone && path === '/') {
    window.history.replaceState(null, '', '/app')
    return <App />
  }

  if (path === '/app' || path.startsWith('/app/') || standalone) {
    return <App />
  }

  document.getElementById('root')?.classList.add('landing-root')
  return (
    <Suspense fallback={null}>
      <Landing />
    </Suspense>
  )
}
