import { supabase } from './supabase'
import { filtreParoisse, getParoisseCourante } from './paroisses'

export interface Temoignage {
  id: string
  auteur_nom: string | null
  contenu: string
  category_id: string | null
  mis_en_avant: boolean
  created_at: string
  nb_gloire: number
  paroisse: string | null
}

export interface Categorie { id: string; slug: string; libelle: string; emoji: string }

export async function getCategories(): Promise<Categorie[]> {
  const { data, error } = await supabase.from('testimony_categories').select('id, slug, libelle, emoji').order('ordre')
  if (error) throw error
  return data ?? []
}

export async function getTemoignagesApprouves(): Promise<Temoignage[]> {
  const requete = (colonnes: string) => {
    const q = filtreParoisse(supabase.from('temoignages').select(colonnes).eq('statut', 'approuve'))
    return (colonnes.includes('mis_en_avant') ? q.order('mis_en_avant', { ascending: false }) : q).order('created_at', { ascending: false })
  }
  // Du plus complet au plus simple, tant que les migrations ne sont pas toutes appliquées.
  const colonnes = [
    'id, auteur_nom, contenu, category_id, mis_en_avant, created_at, nb_gloire, parishes(nom)',
    'id, auteur_nom, contenu, category_id, mis_en_avant, created_at, parishes(nom)',
    'id, auteur_nom, contenu, created_at',
  ]
  let data: any[] | null = null
  let error: unknown = null
  for (const c of colonnes) {
    ({ data, error } = await requete(c))
    if (!error) break
  }
  if (error) throw error
  return (data ?? []).map(({ parishes, ...t }: any) => ({ ...t, category_id: t.category_id ?? null, mis_en_avant: !!t.mis_en_avant, nb_gloire: t.nb_gloire ?? 0, paroisse: parishes?.nom ?? null }))
}

/** « Gloire à Dieu » : +1 sur un témoignage publié ; renvoie le nouveau total. */
export async function rendreGloire(id: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('rendre_gloire', { p_id: id })
  if (error) throw error
  return data as number | null
}

export async function deposerTemoignage(contenu: string, auteurNom?: string, categorieId?: string): Promise<void> {
  const { error } = await supabase.from('temoignages').insert({
    ...(getParoisseCourante() ? { parish_id: getParoisseCourante() } : {}),
    category_id: categorieId || null,
    contenu, auteur_nom: auteurNom || null, statut: 'en_attente',
  })
  if (error) throw error
}
