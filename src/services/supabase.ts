import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase unique de l'application. La clé anon est publique par
 * conception : la sécurité repose sur les politiques Row Level Security.
 *
 * Dans le navigateur, la session est stockée dans des cookies (@supabase/ssr)
 * pour que le middleware Next.js (src/proxy.ts) puisse vérifier l'accès à
 * /admin avant même d'afficher la page. Pendant le rendu serveur des pages,
 * un client sans session suffit : les données sont chargées côté navigateur.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies (.env.local)')
}

export const supabase = typeof window === 'undefined'
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : createBrowserClient(supabaseUrl, supabaseAnonKey)
