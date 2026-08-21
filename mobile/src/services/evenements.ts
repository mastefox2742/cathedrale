import { supabase } from './supabase'

export type EvenementType = 'live' | 'replay' | 'evenement'
export type PlatformType = 'youtube' | 'facebook'

export interface Evenement {
  id?: string
  titre: string
  description: string
  type: EvenementType
  platform: PlatformType
  url: string
  videoId?: string
  thumbnail?: string
  date: string
  heure?: string
  estEnLive?: boolean
  publie: boolean
}

export async function getEvenements(type?: EvenementType): Promise<Evenement[]> {
  let query = supabase.from('evenements').select('*').eq('publie', true).order('date', { ascending: false })
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, titre: r.titre, description: r.description, type: r.type, platform: r.platform,
    url: r.url, videoId: r.video_id ?? undefined, thumbnail: r.thumbnail ?? undefined,
    date: r.date, heure: r.heure ?? undefined, estEnLive: r.est_en_live ?? undefined, publie: r.publie,
  }))
}
