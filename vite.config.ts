import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api/aelf': {
        target: 'https://www.aelf.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aelf/, ''),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'cathedrale.jpg', 'hero-bg.jpg'],
      devOptions: { enabled: true },

      manifest: {
        name: 'Cathédrale Sacré-Cœur de Brazzaville',
        short_name: 'Sacré-Cœur',
        description: 'Plateforme diocésaine — liturgie quotidienne, catéchèse et vie spirituelle de l\'Archidiocèse de Brazzaville',
        theme_color: '#1565C0',
        background_color: '#F5F6FA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        categories: ['lifestyle', 'education', 'religion'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/cathedrale.jpg',
            sizes: '1030x773',
            type: 'image/jpeg',
            // @ts-expect-error - form_factor is valid PWA manifest field
            form_factor: 'narrow',
            label: 'Cathédrale Sacré-Cœur de Brazzaville',
          },
        ],
      },

      workbox: {
        // Fichiers à précacher au premier chargement
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,woff2}'],
        globIgnores: ['**/node_modules/**/*'],

        // Taille max des fichiers précachés (3MB)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

        runtimeCaching: [
          // ── Liturgie AELF — Network First (données fraîches) ─────────────
          {
            urlPattern: /\/api\/aelf/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aelf-liturgie',
              expiration: {
                maxEntries: 7,          // 7 jours de lectures
                maxAgeSeconds: 86400,   // 24h
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ── Firebase Firestore — Network First ───────────────────────────
          {
            urlPattern: /firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-data',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 3600,    // 1h
              },
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ── Firebase Storage (images, audio) — Cache First ────────────────
          {
            urlPattern: /firebasestorage\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 86400,   // 7 jours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ── Google Fonts ──────────────────────────────────────────────────
          {
            urlPattern: /fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 86400,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ── Images locales — Cache First ─────────────────────────────────
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 86400,
              },
            },
          },
          // ── Pages HTML — Network First avec fallback ─────────────────────
          {
            urlPattern: /^https:\/\/[^/]+\/(?!api)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 86400,
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
