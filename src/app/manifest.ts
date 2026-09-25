import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Archidiocèse de Brazzaville — Cathédrale Sacré-Cœur',
    short_name: 'Sacré-Cœur',
    description: "Évangélisation, médiation, catéchèse et vie spirituelle de l'Archidiocèse de Brazzaville",
    theme_color: '#1565C0',
    background_color: '#F5F6FA',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    scope: '/',
    lang: 'fr',
    categories: ['lifestyle', 'education', 'religion'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      { src: '/cathedrale.jpg', sizes: '1030x773', type: 'image/jpeg', form_factor: 'narrow', label: 'Cathédrale Sacré-Cœur de Brazzaville' },
    ],
  }
}
