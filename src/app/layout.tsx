import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { Providers } from './providers'
import '../index.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cathedrale.vercel.app'),
  title: {
    default: 'Archidiocèse de Brazzaville',
    template: '%s · Archidiocèse de Brazzaville',
  },
  description: "Plateforme de l'Archidiocèse de Brazzaville : évangélisation, médiation vidéo, catéchèse, prière et vie des paroisses.",
  keywords: ['archidiocèse', 'brazzaville', 'congo', 'cathédrale', 'sacré-cœur', 'liturgie', 'catéchèse', 'évangélisation', 'église catholique'],
  applicationName: 'Archidiocèse de Brazzaville',
  appleWebApp: { capable: true, title: 'Archidiocèse', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [{ url: '/favicon.png', sizes: '64x64', type: 'image/png' }, { url: '/icons/icon-192.png', sizes: '192x192' }],
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'Archidiocèse de Brazzaville',
    description: 'Évangélisation, médiation, catéchèse et vie paroissiale — Archidiocèse de Brazzaville',
    images: ['/cathedrale.jpg'],
    type: 'website',
    locale: 'fr_CG',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1565C0',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Lire les en-têtes rend chaque page dynamique : Next.js peut alors apposer
  // le nonce de la Content-Security-Policy (src/proxy.ts) sur ses scripts.
  await headers()
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Icônes Material Symbols (administration) — chargées comme avant dans index.html */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
