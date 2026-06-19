import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Native (Capacitor) builds must NOT ship the PWA service worker. Capacitor already
// serves all assets locally and works offline; a Workbox SW inside the webview
// precaches a hashed index.html and then serves it stale after a rebuild, pointing at
// a bundle that no longer exists — which 404s the app's entry script and renders a
// blank white screen. Build native with `CAP_BUILD=1` (see package.json build:native).
const isNativeBuild = process.env.CAP_BUILD === '1'

// Vite tags the entry <script type="module"> and stylesheet with `crossorigin`.
// Under Capacitor's custom scheme (capacitor://localhost on iOS), that forces WKWebView
// into CORS mode; the scheme handler returns no Access-Control-Allow-Origin header, so
// the webview silently refuses to execute the module → blank white screen. Same-origin
// in a real browser doesn't care, so we only strip it for native builds.
const stripCrossorigin = {
  name: 'strip-crossorigin',
  transformIndexHtml(html: string) {
    return html.replace(/ crossorigin/g, '')
  },
}

export default defineConfig({
  plugins: [
    react(),
    ...(isNativeBuild ? [stripCrossorigin] : [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'FastDiet',
        short_name: 'FastDiet',
        description: 'Eat at the rate of your future, slimmer self.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        // `id` pins the install identity so changing `start_url` does not make
        // browsers treat existing installs as a new app (no reinstall). The
        // public landing page lives at `/`; the installed app launches at `/app`.
        id: '/',
        start_url: '/app',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png',            sizes: '64x64',    type: 'image/png' },
          { src: 'pwa-192x192.png',           sizes: '192x192',  type: 'image/png' },
          { src: 'pwa-512x512.png',           sizes: '512x512',  type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512',  type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Landing-page screenshots are only shown to online browser visitors;
        // don't bloat the installed app's offline precache with them.
        globIgnores: ['**/screenshots/**'],
      },
    })]),
  ],
})
