/**
 * Configuration Next.js — Plateforme de l'Archidiocèse de Brazzaville.
 *
 * Les variables publiques s'appellent NEXT_PUBLIC_* ; pour ne pas casser les
 * déploiements existants (variables VITE_* déjà définies sur Vercel), on
 * accepte encore l'ancien nom en repli.
 */
const pub = (name) => process.env[`NEXT_PUBLIC_${name}`] ?? process.env[`VITE_${name}`] ?? ''

/**
 * Content-Security-Policy, en mode « observation » (Report-Only) : rien n'est
 * bloqué, les écarts sont remontés à /api/csp-report (journaux Vercel). Une
 * fois la liste validée, renommer l'en-tête en Content-Security-Policy.
 */
const CSP = [
  "default-src 'self'",
  // Next.js injecte des scripts en ligne ; Firebase charge son SDK depuis gstatic (service worker).
  "script-src 'self' 'unsafe-inline' https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://upload.wikimedia.org",
  "media-src 'self' blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://www.gstatic.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.openstreetmap.org https://maps.google.com https://www.google.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'report-uri /api/csp-report',
].join('; ')

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
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: PERMISSIONS },
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
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
