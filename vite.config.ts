import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '하나 Hana — Finanzas',
        short_name: '하나',
        description: 'Mi camino financiero · 나의 금융 길',
        start_url: '/',
        display: 'standalone',
        background_color: '#FBF5E6',
        theme_color: '#C0392B',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dolarapi\.com\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dolar-api-cache',
              expiration: { maxAgeSeconds: 300 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-cache' }
          }
        ]
      }
    })
  ]
})
