import { supabase } from './supabase'

export type StatutFormation = 'en_cours' | 'termine'

export interface FormationProgress {
  id: string
  user_id: string
  cours_id: string
  statut: StatutFormation
  started_at: string
  completed_at: string | null
}

export async function getMesFormations(userId: string): Promise<FormationProgress[]> {
  const { data, error } = await supabase
    .from('formation_progress')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function demarrerFormation(userId: string, coursId: string): Promise<void> {
  const { error } = await supabase
    .from('formation_progress')
    .upsert({ user_id: userId, cours_id: coursId, statut: 'en_cours' }, { onConflict: 'user_id,cours_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function terminerFormation(userId: string, coursId: string): Promise<void> {
  const { error } = await supabase
    .from('formation_progress')
    .upsert({ user_id: userId, cours_id: coursId, statut: 'termine', completed_at: new Date().toISOString() }, { onConflict: 'user_id,cours_id' })
  if (error) throw error
}
