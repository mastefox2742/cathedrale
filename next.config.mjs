/**
 * Configuration Next.js — Plateforme de l'Archidiocèse de Brazzaville.
 *
 * Les variables publiques s'appellent NEXT_PUBLIC_* ; pour ne pas casser les
 * déploiements existants (variables VITE_* déjà définies sur Vercel), on
 * accepte encore l'ancien nom en repli.
 */
const pub = (name) => process.env[`NEXT_PUBLIC_${name}`] ?? process.env[`VITE_${name}`] ?? ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: pub('SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: pub('SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_FIREBASE_API_KEY: pub('FIREBASE_API_KEY'),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: pub('FIREBASE_AUTH_DOMAIN'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: pub('FIREBASE_PROJECT_ID'),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: pub('FIREBASE_STORAGE_BUCKET'),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: pub('FIREBASE_MESSAGING_SENDER_ID'),
    NEXT_PUBLIC_FIREBASE_APP_ID: pub('FIREBASE_APP_ID'),
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: pub('FIREBASE_VAPID_KEY'),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async redirects() {
    // Ancienne page « Médias & Lives » remplacée par la chaîne (Médiation / TV).
    return [{ source: '/evenements', destination: '/tv', permanent: true }]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
