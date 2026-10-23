/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Deploying to https://jakub-kos.github.io/copenhagen/
export default defineConfig({
  plugins: [react()],
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
