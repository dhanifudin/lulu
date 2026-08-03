import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Custom domain https://lulu.ulfillah.com → app lives at root /
const BASE = '/'

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
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'icon.svg', 'flower-192.png', 'flower-512.png', 'apple-touch-icon.png'],
      manifest: {
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
