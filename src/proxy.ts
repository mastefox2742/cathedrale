import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { depasse, ipDe, limitePour } from './lib/securite/limiteur'

/**
 * Middleware Next.js (appelé « proxy » depuis Next.js 16).
 *
 * 1. Content-Security-Policy stricte : un nonce aléatoire par requête, seuls
 *    les scripts portant ce nonce (et ceux qu'ils chargent) s'exécutent.
 * 2. Limitation de débit par IP sur les API et les pages de connexion.
 * 3. /admin : session obligatoire, rôle de staff (is_staff) et double
 *    authentification (niveau aal2) — sinon redirection vers /admin/login ou
 *    /admin/mfa avant tout rendu. Rafraîchit aussi les cookies Supabase.
 *
 * Les droits fins (quelle paroisse, quelles pages) restent vérifiés par la base
 * (Row Level Security) — ce contrôle n'est qu'une première barrière.
 */

function politique(nonce: string): string {
  const dev = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${dev ? " 'unsafe-eval'" : ''}`,
    // Les attributs style="" générés par React exigent 'unsafe-inline' pour les styles (pas pour les scripts).
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://upload.wikimedia.org",
    "media-src 'self' blob: https://*.supabase.co",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://www.gstatic.com https://challenges.cloudflare.com${dev ? ' ws:' : ''}`,
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.openstreetmap.org https://maps.google.com https://www.google.com https://challenges.cloudflare.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
    'report-uri /api/csp-report',
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const chemin = request.nextUrl.pathname

  // ── Limitation de débit ──
  const limite = limitePour(chemin)
  if (limite && depasse(ipDe(request.headers), chemin, limite)) {
    return new NextResponse('Trop de requêtes. Réessayez dans une minute.', {
      status: 429,
      headers: { 'Retry-After': '60', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // ── CSP avec nonce (transmise à Next.js par l'en-tête de la requête) ──
  const nonce = btoa(crypto.randomUUID())
  const csp = politique(nonce)
  const entetes = new Headers(request.headers)
  entetes.set('x-nonce', nonce)
  entetes.set('Content-Security-Policy', csp)

  let response = NextResponse.next({ request: { headers: entetes } })
  const finaliser = (r: NextResponse) => { r.headers.set('Content-Security-Policy', csp); return r }

  if (!chemin.startsWith('/admin')) return finaliser(response)

  // ── Espace d'administration ──
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return finaliser(response)

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request: { headers: entetes } })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const surLogin = chemin === '/admin/login'
  const surMfa = chemin === '/admin/mfa'
  const rediriger = (vers: string) => {
    const cible = request.nextUrl.clone()
    cible.pathname = vers
    cible.search = ''
    if (vers === '/admin/login' || vers === '/admin/mfa') cible.searchParams.set('suite', surMfa || surLogin ? '/admin' : chemin)
    const r = NextResponse.redirect(cible)
    response.cookies.getAll().forEach(c => r.cookies.set(c))
    return finaliser(r)
  }

  if (surLogin) return finaliser(response)
  if (!user) return rediriger('/admin/login')

  // Staff ? (fonction qui ignore le niveau d'authentification, pour savoir où envoyer la personne)
  const { data: staff } = await supabase.rpc('staff_sans_mfa')
  const { data: staffAvant } = staff == null ? await supabase.rpc('is_staff') : { data: null }
  if (!(staff ?? staffAvant)) return rediriger('/admin/login')

  const { data: niveau } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const mfaOk = niveau?.currentLevel === 'aal2'
  if (surMfa) return mfaOk ? rediriger('/admin') : finaliser(response)
  if (!mfaOk) return rediriger('/admin/mfa')

  return finaliser(response)
}

export const config = {
  matcher: [
    // Toutes les pages et API, sauf les fichiers statiques et les service workers.
    '/((?!_next/static|_next/image|favicon.png|icons/|images/|videos/|logo|sw.js|firebase-messaging-sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|webp|svg|mp4|txt)$).*)',
  ],
}
