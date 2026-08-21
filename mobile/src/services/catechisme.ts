import { supabase } from './supabase'

export type NiveauType = 1 | 2 | 3 | 4

export interface Cours {
  id?: string
  niveau: NiveauType
  titre: string
  tranche: string
  description: string
  objectif: string
  emoji: string
  couleur: string
  totalModules: number
  publie: boolean
}

export async function getCours(): Promise<Cours[]> {
  const { data, error } = await supabase.from('cours').select('*').eq('publie', true).order('niveau')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, niveau: r.niveau, titre: r.titre, tranche: r.tranche, description: r.description,
    objectif: r.objectif, emoji: r.emoji, couleur: r.couleur, totalModules: r.total_modules, publie: r.publie,
  }))
}

export interface Module {
  id?: string
  coursId: string
  ordre: number
  titre: string
  emoji: string
}

export async function getModules(coursId: string): Promise<Module[]> {
  const { data, error } = await supabase.from('catechisme_modules').select('id, cours_id, ordre, titre, emoji')
    .eq('cours_id', coursId).eq('publie', true).order('ordre')
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, coursId: r.cours_id, ordre: r.ordre, titre: r.titre, emoji: r.emoji }))
}
