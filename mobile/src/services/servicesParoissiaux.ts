import { supabase } from './supabase'

export interface ServiceParoissial {
  id: string
  nom: string
  description: string
  categorie: string
  contact?: string
  horaire?: string
  emoji: string
}

export async function getServicesParoissiaux(): Promise<ServiceParoissial[]> {
  const { data, error } = await supabase.from('services_paroissiaux').select('*').eq('publie', true).order('categorie')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, nom: r.nom, description: r.description, categorie: r.categorie,
    contact: r.contact ?? undefined, horaire: r.horaire ?? undefined, emoji: r.emoji,
  }))
}
