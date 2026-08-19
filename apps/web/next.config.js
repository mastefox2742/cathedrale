/** @type {import('next').NextConfig} */

// Headers de securite HTTP (checklist "Headers de securite complets" + CSP).
// A tester avec https://securityheaders.com et https://csp-evaluator.withgoogle.com
// une fois le nom de domaine de production connu.
//
// En dev, `next dev` injecte des scripts inline et utilise eval() pour le Fast
// Refresh/HMR : un script-src 'self' strict casse systematiquement le mode dev.
// On ne resserre script-src (et on retire upgrade-insecure-requests, inutile en
// http://localhost) qu'en production.
const isDev = process.env.NODE_ENV !== "production";

// NEXT_PUBLIC_API_URL inclut un chemin (ex: http://localhost:4000/api/v1) -
// connect-src ne doit recevoir que l'origine.
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : "";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    // 'unsafe-inline' sur style-src toleree pour les styles injectes par Next -
    // a resserrer avec des nonces si un besoin de script inline apparait.
    value: [
      "default-src 'self'",
      isDev ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // Uniquement l'origine (schema+host+port), jamais le chemin: le support
      // des chemins dans les source-expressions connect-src est incoherent
      // selon les navigateurs et peut bloquer des requetes pourtant valides.
      "connect-src 'self' " + apiOrigin,
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // ne pas annoncer "X-Powered-By: Next.js"

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    // Liste blanche explicite des domaines d'images distantes (media paroissial).
    // A completer avec le domaine reel du stockage (S3/GCS/CDN) en production.
    remotePatterns: [],
  },
};

module.exports = nextConfig;
