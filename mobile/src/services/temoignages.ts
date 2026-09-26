import { supabase } from './supabase'
import { filtreParoisse, getParoisseCourante } from './paroisses'

export interface Temoignage {
  id: string
  auteur_nom: string | null
  contenu: string
  category_id: string | null
  mis_en_avant: boolean
  created_at: string
}

export interface Categorie { id: string; slug: string; libelle: string; emoji: string }

export async function getCategories(): Promise<Categorie[]> {
  const { data, error } = await supabase.from('testimony_categories').select('id, slug, libelle, emoji').order('ordre')
  if (error) throw error
  return data ?? []
}

export async function getTemoignagesApprouves(): Promise<Temoignage[]> {
  const { data, error } = await filtreParoisse(supabase.from('temoignages').select('id, auteur_nom, contenu, category_id, mis_en_avant, created_at')
    .eq('statut', 'approuve')).order('mis_en_avant', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deposerTemoignage(contenu: string, auteurNom?: string, categorieId?: string): Promise<void> {
  const { error } = await supabase.from('temoignages').insert({
    ...(getParoisseCourante() ? { parish_id: getParoisseCourante() } : {}),
    category_id: categorieId || null,
    contenu, auteur_nom: auteurNom || null, statut: 'en_attente',
  })
  if (error) throw error
}
