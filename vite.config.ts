import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
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
      },
    }),
  ],
})
