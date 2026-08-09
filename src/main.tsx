import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'
import { initNativeShell } from './lib/nativeShell'

// Not awaited: the shell setup is cosmetic (status bar, keyboard, splash) and
// must never delay first paint. It resolves against the already-mounted app.
void initNativeShell()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
