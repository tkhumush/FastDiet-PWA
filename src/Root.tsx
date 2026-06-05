import App from './App'
import { Landing } from './components/Landing'
import { isStandalone } from './lib/platform'

// Top-level surface picker (the app's only "router"). Evaluated once per full
// page load — navigation between the landing and the app is a full-page change.
//
// - The installed PWA launches at `/app` (manifest start_url) and renders App.
// - Existing installs whose cached manifest still has start_url `/` open in
//   standalone mode at `/`; we detect that and render App so they never see the
//   marketing page (no reinstall needed).
// - Everything else in a browser gets the public Landing page.
export default function Root() {
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
  return <Landing />
}
