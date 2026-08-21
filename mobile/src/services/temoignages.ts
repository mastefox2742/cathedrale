import { supabase } from './supabase'

export interface Temoignage {
  id: string
  auteur_nom: string | null
  contenu: string
  created_at: string
}

export async function getTemoignagesApprouves(): Promise<Temoignage[]> {
  const { data, error } = await supabase.from('temoignages').select('id, auteur_nom, contenu, created_at')
    .eq('statut', 'approuve').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deposerTemoignage(contenu: string, auteurNom?: string): Promise<void> {
  const { error } = await supabase.from('temoignages').insert({
    contenu, auteur_nom: auteurNom || null, statut: 'en_attente',
  })
  if (error) throw error
}
