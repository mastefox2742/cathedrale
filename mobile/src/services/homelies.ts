import { supabase } from './supabase'

export interface Homelie {
  id?: string
  titre: string
  pretre: string
  date: string
  texte: string
  audioUrl?: string
  liturgieRef?: string
  publie: boolean
}

export async function getHomelies(): Promise<Homelie[]> {
  const { data, error } = await supabase
    .from('homelies')
    .select('*')
    .eq('publie', true)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, titre: r.titre, pretre: r.pretre, date: r.date, texte: r.texte,
    audioUrl: r.audio_url ?? undefined, liturgieRef: r.liturgie_ref ?? undefined, publie: r.publie,
  }))
}
