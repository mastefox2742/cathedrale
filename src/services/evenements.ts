import { supabase } from './supabase'
import { filtrePublic, filtreAdmin, parishIdPourCreation } from './scope'
import { logAudit } from './auditLog'

export type EvenementType = 'live' | 'replay' | 'evenement'
export type PlatformType = 'youtube' | 'facebook'

export type PublicCible = 'decouvre' | 'conversion' | 'baptise' | 'prier' | 'approfondir' | 'jeunes' | 'famille'

export const PUBLIC_CIBLE_LABELS: Record<PublicCible, string> = {
  decouvre: 'Je découvre la foi',
  conversion: 'Je veux me convertir',
  baptise: 'Je suis baptisé',
  prier: 'Je veux prier',
  approfondir: 'Approfondir',
  jeunes: 'Jeunes',
  famille: 'Famille',
}

export interface Evenement {
  id?: string
  titre: string
  description: string
  type: EvenementType
  platform: PlatformType
  url: string                // URL YouTube ou Facebook
  videoId?: string           // ID extrait pour l'embed
  thumbnail?: string
  date: string               // ISO date
  heure?: string
  estEnLive?: boolean
  publie: boolean
  theme?: string
  intervenant?: string
  publicCible?: PublicCible
  vues?: number
  secondesVues?: number
  aLaUne?: boolean
  createdAt?: string
}

const TABLE = 'evenements'

interface EvenementRow {
  id: string
  titre: string
  description: string
  type: EvenementType
  platform: PlatformType
  url: string
  video_id: string | null
  thumbnail: string | null
  date: string
  heure: string | null
  est_en_live: boolean | null
  publie: boolean
  theme?: string | null
  intervenant?: string | null
  public_cible?: PublicCible | null
  vues?: number
  secondes_vues?: number
  a_la_une?: boolean
  created_at: string
}

function fromRow(r: EvenementRow): Evenement {
  return {
    id: r.id, titre: r.titre, description: r.description, type: r.type, platform: r.platform,
    url: r.url, videoId: r.video_id ?? undefined, thumbnail: r.thumbnail ?? undefined,
    date: r.date, heure: r.heure ?? undefined, estEnLive: r.est_en_live ?? undefined,
    publie: r.publie, theme: r.theme ?? undefined, intervenant: r.intervenant ?? undefined,
    publicCible: r.public_cible ?? undefined, vues: r.vues ?? 0, secondesVues: Number(r.secondes_vues ?? 0), aLaUne: r.a_la_une ?? false,
    createdAt: r.created_at,
  }
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ]
  for (const p of patterns) {
    const m = p.exec(url)
    if (m) return m[1]
  }
  return null
}

function extractFacebookVideoId(url: string): string | null {
  const m = /\/videos\/(\d+)/.exec(url)
  return m ? m[1] : null
}

export function enrichEvenement(data: Omit<Evenement, 'id' | 'createdAt'>): Omit<Evenement, 'id' | 'createdAt'> {
  if (data.platform === 'youtube') {
    const id = extractYoutubeId(data.url)
    return {
      ...data,
      videoId: id ?? undefined,
      thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined,
    }
  }
  if (data.platform === 'facebook') {
    const id = extractFacebookVideoId(data.url)
    return { ...data, videoId: id ?? undefined }
  }
  return data
}

export async function getEvenements(type?: EvenementType): Promise<Evenement[]> {
  let query = filtrePublic(supabase.from(TABLE).select('*').eq('publie', true)).order('date', { ascending: false })
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getAllEvenements(): Promise<Evenement[]> {
  const { data, error } = await filtreAdmin(supabase.from(TABLE).select('*')).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addEvenement(data: Omit<Evenement, 'id' | 'createdAt'>): Promise<string> {
  const enriched = enrichEvenement(data)
  const { data: row, error } = await supabase.from(TABLE).insert({
    parish_id: parishIdPourCreation(),
    theme: enriched.theme || null, intervenant: enriched.intervenant || null,
    public_cible: enriched.publicCible || null, a_la_une: enriched.aLaUne ?? false,
    titre: enriched.titre, description: enriched.description, type: enriched.type, platform: enriched.platform,
    url: enriched.url, video_id: enriched.videoId || null, thumbnail: enriched.thumbnail || null,
    date: enriched.date, heure: enriched.heure || null, est_en_live: enriched.estEnLive ?? null,
    publie: enriched.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'evenement', row.id, data.titre)
  return row.id
}

export async function updateEvenement(id: string, data: Partial<Evenement>): Promise<void> {
  const enriched = data.url ? enrichEvenement(data as Omit<Evenement, 'id' | 'createdAt'>) : data
  const patch: Record<string, unknown> = {}
  if (enriched.titre !== undefined) patch.titre = enriched.titre
  if (enriched.description !== undefined) patch.description = enriched.description
  if (enriched.type !== undefined) patch.type = enriched.type
  if (enriched.platform !== undefined) patch.platform = enriched.platform
  if (enriched.url !== undefined) patch.url = enriched.url
  if (enriched.videoId !== undefined) patch.video_id = enriched.videoId || null
  if (enriched.thumbnail !== undefined) patch.thumbnail = enriched.thumbnail || null
  if (enriched.date !== undefined) patch.date = enriched.date
  if (enriched.heure !== undefined) patch.heure = enriched.heure || null
  if (enriched.estEnLive !== undefined) patch.est_en_live = enriched.estEnLive
  if (enriched.publie !== undefined) patch.publie = enriched.publie
  if (enriched.theme !== undefined) patch.theme = enriched.theme || null
  if (enriched.intervenant !== undefined) patch.intervenant = enriched.intervenant || null
  if (enriched.publicCible !== undefined) patch.public_cible = enriched.publicCible || null
  if (enriched.aLaUne !== undefined) patch.a_la_une = enriched.aLaUne

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'evenement', id, data.titre)
}

export async function deleteEvenement(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'evenement', id)
}

/** Vidéos mises en avant sur l'accueil (« À la une »), sinon les plus récentes. */
export async function getALaUne(max = 3): Promise<Evenement[]> {
  const { data, error } = await filtrePublic(supabase.from(TABLE).select('*').eq('publie', true))
    .order('a_la_une', { ascending: false }).order('date', { ascending: false }).limit(max)
  if (error) throw error
  return (data ?? []).map(fromRow)
}

/** Compte une lecture (statistiques de la médiation). */
export function compterVue(id: string): void {
  supabase.rpc('incrementer_vue', { p_id: id }).then(() => {}, () => {})
}

/** Ajoute des secondes de visionnage (statistiques de la médiation). */
export function ajouterVisionnage(id: string, secondes: number): void {
  if (secondes < 1) return
  supabase.rpc('ajouter_visionnage', { p_id: id, p_secondes: Math.round(secondes) }).then(() => {}, () => {})
}
