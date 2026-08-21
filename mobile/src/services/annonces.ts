import { supabase } from './supabase'

export type TagType = 'Liturgie' | 'Formation' | 'Prière' | 'Événement'

export interface Annonce {
  id?: string
  titre: string
  desc: string
  tag: TagType
  date: string
  imageUrl?: string
  epingle: boolean
  publie: boolean
}

export async function getAnnonces(): Promise<Annonce[]> {
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .eq('publie', true)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, titre: r.titre, desc: r.description, tag: r.tag, date: r.date,
    imageUrl: r.image_url ?? undefined, epingle: r.epingle, publie: r.publie,
  }))
}
