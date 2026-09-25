import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware Next.js (appelé « proxy » depuis Next.js 16).
 *
 * Protège /admin côté serveur : sans session, ou avec un compte qui n'a aucun
 * rôle de staff (fonction SQL is_staff(), rôles globaux ou paroissiaux), la
 * requête est redirigée vers /admin/login avant tout rendu. Rafraîchit aussi
 * les cookies de session Supabase.
 *
 * Les droits fins (quelle paroisse, quelles pages) restent vérifiés par la base
 * (Row Level Security) — ce contrôle n'est qu'une première barrière.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const surLogin = request.nextUrl.pathname === '/admin/login'

  if (!surLogin) {
    let autorise = false
    if (user) {
      const { data } = await supabase.rpc('is_staff')
      autorise = data === true
    }
    if (!autorise) {
      const login = request.nextUrl.clone()
      login.pathname = '/admin/login'
      login.search = ''
      login.searchParams.set('suite', request.nextUrl.pathname)
      const redirection = NextResponse.redirect(login)
      response.cookies.getAll().forEach(c => redirection.cookies.set(c))
      return redirection
    }
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
