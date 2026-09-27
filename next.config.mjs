/**
 * Configuration Next.js — Plateforme de l'Archidiocèse de Brazzaville.
 *
 * Les variables publiques s'appellent NEXT_PUBLIC_* ; pour ne pas casser les
 * déploiements existants (variables VITE_* déjà définies sur Vercel), on
 * accepte encore l'ancien nom en repli.
 */
const pub = (name) => process.env[`NEXT_PUBLIC_${name}`] ?? process.env[`VITE_${name}`] ?? ''

/** Fonctions du navigateur : géolocalisation pour « la paroisse la plus proche », le reste coupé. */
const PERMISSIONS = 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), serial=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()'

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
          // La Content-Security-Policy (avec nonce) est posée par src/proxy.ts.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: PERMISSIONS },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
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
