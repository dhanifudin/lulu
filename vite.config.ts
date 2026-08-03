import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Custom domain https://lulu.ulfillah.com → app lives at root /
const BASE = '/'

// SPA fallback for GitHub Pages: copy the SW-injected index.html to 404.html
// so deep links (e.g. /jadwal, /kebiasaan) don't 404 on hard refresh.
// This runs AFTER VitePWA closes the bundle so registerSW.js is already injected.
const spa404Plugin = {
  name: 'spa-404-fallback',
  closeBundle() {
    const distDir = resolve(__dirname, 'dist')
    copyFileSync(resolve(distDir, 'index.html'), resolve(distDir, '404.html'))
  },
}

export default defineConfig({
  base: BASE,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    VitePWA({
      // Custom SW so we can handle Web Push (generateSW has no push handler)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'icon.svg', 'flower-192.png', 'flower-512.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Lulu 🌸 Jadwal & Kebiasaan',
        short_name: 'Lulu',
        description: 'Jadwal sekolah dan kebiasaan baik untuk Lulu 🌸',
        theme_color: '#FF8FB1',
        background_color: '#FFF7F0',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'flower-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'flower-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      injectManifest: {
        // Glob patterns for assets to precache (navigation fallback handled in src/sw.ts)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      // Enable SW in dev so Chrome shows "Install app" on localhost too.
      // type:'module' required because src/sw.ts uses ES imports.
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
    spa404Plugin,
  ],
})
