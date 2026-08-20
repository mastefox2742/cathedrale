import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase — utilisé pour l'authentification "Espace Membre"
 * (voir ConnexionPage). La clé anon est publique par conception (protégée
 * par les policies Row Level Security côté serveur, jamais par le secret
 * lui-même) : rien à cacher ici, contrairement à une clé service_role.
 *
 * Le reste de l'app (contenu, médiathèque, admin) reste sur Firebase pour
 * l'instant — voir src/services/firebase.ts. Migration progressive.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans .env.local',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
