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
      manifest: {
        name: 'Cathédrale Sacré-Cœur de Brazzaville',
        short_name: 'Sacré-Cœur',
        description: 'Plateforme diocésaine — liturgie, catéchèse et vie spirituelle',
        theme_color: '#6B1A1A',
        background_color: '#FDF8F0',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
