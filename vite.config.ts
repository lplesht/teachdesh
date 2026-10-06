import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/teachdesh/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // injectManifest (a hand-written service worker, src/sw.js) instead of
      // the default generateSW - push notifications need the SW to handle
      // raw 'push'/'notificationclick' events itself, which generateSW's
      // auto-generated worker has no hook for.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      manifest: {
        name: 'כיתת ענן',
        short_name: 'כיתת ענן',
        description: 'עדכונים, מטלות ואירועי הכיתה - במקום אחד',
        start_url: '/teachdesh/',
        scope: '/teachdesh/',
        display: 'standalone',
        background_color: '#f4f6fb',
        theme_color: '#2f4bd9',
        dir: 'rtl',
        lang: 'he',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
