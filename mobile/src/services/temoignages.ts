import { supabase } from './supabase'
import { filtreParoisse, getParoisseCourante } from './paroisses'

export interface Temoignage {
  id: string
  auteur_nom: string | null
  contenu: string
  created_at: string
}

export async function getTemoignagesApprouves(): Promise<Temoignage[]> {
  const { data, error } = await filtreParoisse(supabase.from('temoignages').select('id, auteur_nom, contenu, created_at')
    .eq('statut', 'approuve')).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deposerTemoignage(contenu: string, auteurNom?: string): Promise<void> {
  const { error } = await supabase.from('temoignages').insert({
    ...(getParoisseCourante() ? { parish_id: getParoisseCourante() } : {}),
    contenu, auteur_nom: auteurNom || null, statut: 'en_attente',
  })
  if (error) throw error
}
