/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const DAY = 24 * 60 * 60

// Deploying to https://jakub-kos.github.io/copenhagen/
export default defineConfig({
  plugins: [
    react(),
    // Offline: the app shell and guide data are precached; the map, map fonts and photos are
    // cached as they load (and by "Save for offline", which writes into the same caches;
    // keep the cache names in sync with src/services/offline.ts). Routes, forecast and
    // exchange rates already live in localStorage.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kodaň · Copenhagen',
        short_name: 'Kodaň',
        description: 'Průvodce a plánovač výletu do Kodaně',
        lang: 'cs',
        start_url: '/copenhagen/',
        scope: '/copenhagen/',
        display: 'standalone',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Styles and the tilejson: fresh when online (they name the current tile release).
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/(styles\/[^/]+|planet)$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'cph-map-meta', networkTimeoutSeconds: 4, expiration: { maxEntries: 10 } },
          },
          {
            // Tiles, fonts, sprites: URLs are versioned, so a cached copy is always right.
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cph-map',
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /^https:\/\/(thumb|upload)\.wikimedia\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cph-photos',
              expiration: { maxEntries: 300, maxAgeSeconds: 120 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/copenhagen/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // MapLibre is most of the bundle; a separate chunk caches across app updates.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: { maplibre: ['maplibre-gl'] },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
