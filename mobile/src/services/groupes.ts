import { supabase } from './supabase'

export interface Groupe {
  id?: string
  titre: string
  description: string
  categorie: string
  responsable?: string
  horaire?: string
  contact?: string
  icon: string
  publie: boolean
}

export async function getGroupes(): Promise<Groupe[]> {
  const { data, error } = await supabase.from('groupes').select('*').eq('publie', true).order('titre')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, titre: r.titre, description: r.description, categorie: r.categorie,
    responsable: r.responsable ?? undefined, horaire: r.horaire ?? undefined,
    contact: r.contact ?? undefined, icon: r.icon, publie: r.publie,
  }))
}
