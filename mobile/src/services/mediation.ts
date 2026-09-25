import { supabase } from './supabase'
import { filtreParoisse } from './paroisses'

export type PublicCible = 'decouvre' | 'conversion' | 'baptise' | 'prier' | 'approfondir' | 'jeunes' | 'famille'

export const PUBLIC_CIBLE_LABELS: Record<PublicCible, string> = {
  decouvre: 'Je découvre',
  conversion: 'Me convertir',
  baptise: 'Je suis baptisé',
  prier: 'Je veux prier',
  approfondir: 'Approfondir',
  jeunes: 'Jeunes',
  famille: 'Famille',
}

export interface Direct {
  id: string
  titre: string
  description: string
  url: string
  debut: string
  statut: 'programme' | 'en_direct' | 'termine'
  intervenant: string | null
}

export interface Video {
  id: string
  titre: string
  url: string
  thumbnail: string | null
  date: string
  theme: string | null
  intervenant: string | null
  publicCible: PublicCible | null
}

export interface Playlist {
  id: string
  titre: string
  publicCible: PublicCible
  evenementIds: string[]
}

export async function getDirectsAVenir(): Promise<Direct[]> {
  const depuis = new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  const { data, error } = await filtreParoisse(supabase.from('live_events').select('id, titre, description, url, debut, statut, intervenant').eq('publie', true).neq('statut', 'termine'))
    .gte('debut', depuis).order('debut').limit(10)
  if (error) throw error
  return data ?? []
}

export async function getVideos(): Promise<Video[]> {
  const { data, error } = await filtreParoisse(supabase.from('evenements').select('id, titre, url, thumbnail, date, theme, intervenant, public_cible').eq('publie', true))
    .order('date', { ascending: false }).limit(60)
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, titre: r.titre, url: r.url, thumbnail: r.thumbnail, date: r.date,
    theme: r.theme, intervenant: r.intervenant, publicCible: r.public_cible,
  }))
}

export async function getPlaylists(): Promise<Playlist[]> {
  const { data, error } = await filtreParoisse(supabase.from('playlists').select('id, titre, public_cible, playlist_items(evenement_id, ordre)').eq('publie', true)).order('ordre')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, titre: r.titre, publicCible: r.public_cible,
    evenementIds: [...(r.playlist_items ?? [])].sort((a, b) => a.ordre - b.ordre).map(i => i.evenement_id),
  }))
}

/** Statistiques de la médiation (compteur de lectures). */
export function compterVue(id: string): void {
  supabase.rpc('incrementer_vue', { p_id: id }).then(() => {}, () => {})
}
