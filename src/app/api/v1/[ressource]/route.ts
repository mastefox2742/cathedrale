import { createClient } from '@supabase/supabase-js'

/**
 * API publique en lecture seule, pour de futures intégrations (application
 * tierce, site d'une paroisse, écran d'accueil…). Elle n'expose que des
 * données déjà publiques : la clé anon et les règles RLS s'appliquent.
 *
 * GET /api/v1/paroisses
 * GET /api/v1/annonces?paroisse=<slug>
 * GET /api/v1/videos?paroisse=<slug>
 * GET /api/v1/directs
 * GET /api/v1/parcours?type=decouvrir|conversion|approfondir|neuvaine|retraite
 * GET /api/v1/homelies?paroisse=<slug>
 */

const RESSOURCES = {
  paroisses: { table: 'parishes', colonnes: 'nom, slug, description, cure, adresse, quartier, ville, latitude, longitude, telephone, email, horaires', ordre: 'nom', publie: null, parParoisse: false },
  annonces: { table: 'annonces', colonnes: 'titre, description, tag, date, image_url, parish_id', ordre: 'date', publie: 'publie', parParoisse: true },
  videos: { table: 'evenements', colonnes: 'titre, description, type, platform, url, thumbnail, date, heure, theme, intervenant, public_cible, parish_id', ordre: 'date', publie: 'publie', parParoisse: true },
  directs: { table: 'live_events', colonnes: 'titre, description, url, debut, fin, statut, intervenant, theme, parish_id', ordre: 'debut', publie: 'publie', parParoisse: true },
  parcours: { table: 'evangelization_paths', colonnes: 'titre, slug, type, description, emoji, duree, parish_id', ordre: 'ordre', publie: 'publie', parParoisse: true },
  homelies: { table: 'homelies', colonnes: 'titre, pretre, date, texte, audio_url, liturgie_ref, parish_id', ordre: 'date', publie: 'publie', parParoisse: true },
} as const

type Ressource = keyof typeof RESSOURCES

/**
 * CORS : seuls les sites listés dans API_CORS_ORIGINS (séparés par des virgules)
 * peuvent lire l'API depuis un navigateur. Les appels serveur à serveur ne
 * sont pas concernés par CORS.
 */
const ORIGINES = (process.env.API_CORS_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean)

function reponse(corps: unknown, status = 200, origine: string | null = null) {
  const entetes: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    Vary: 'Origin',
  }
  if (origine && ORIGINES.includes(origine)) entetes['Access-Control-Allow-Origin'] = origine
  return new Response(JSON.stringify(corps), { status, headers: entetes })
}

export async function GET(request: Request, { params }: { params: Promise<{ ressource: string }> }) {
  const { ressource } = await params
  const origine = request.headers.get('Origin')
  if (!(ressource in RESSOURCES)) {
    return reponse({ erreur: 'Ressource inconnue', ressources: Object.keys(RESSOURCES) }, 404, origine)
  }
  const def = RESSOURCES[ressource as Ressource]
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return reponse({ erreur: 'Service indisponible' }, 503, origine)
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { searchParams } = new URL(request.url)
  const limite = Math.min(Math.max(Number(searchParams.get('limite')) || 50, 1), 200)

  let query = supabase.from(def.table as string).select(def.colonnes as string)
  if (def.publie) query = query.eq(def.publie, true)
  if (ressource === 'paroisses') query = query.eq('actif', true)

  // Filtre paroisse : contenus de la paroisse + contenus de l'archidiocèse.
  const slug = searchParams.get('paroisse')
  if (def.parParoisse && slug) {
    if (!/^[a-z0-9-]+$/.test(slug)) return reponse({ erreur: 'paroisse invalide' }, 400, origine)
    const { data: p } = await supabase.from('parishes').select('id').eq('slug', slug).maybeSingle()
    if (!p) return reponse({ erreur: 'Paroisse introuvable' }, 404, origine)
    query = query.or(`parish_id.is.null,parish_id.eq.${p.id}`)
  }
  const type = searchParams.get('type')
  if (ressource === 'parcours' && type) {
    if (!['decouvrir', 'conversion', 'approfondir', 'neuvaine', 'retraite'].includes(type)) return reponse({ erreur: 'type invalide' }, 400, origine)
    query = query.eq('type', type)
  }
  if (ressource === 'directs') query = query.neq('statut', 'termine')

  const { data, error } = await query.order(def.ordre, { ascending: ['nom', 'ordre', 'debut'].includes(def.ordre) }).limit(limite)
  if (error) return reponse({ erreur: 'Lecture impossible' }, 502, origine)
  return reponse({ donnees: data ?? [], nombre: data?.length ?? 0 }, 200, origine)
}
