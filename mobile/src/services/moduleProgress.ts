import { supabase } from './supabase'

export async function getModulesTermines(userId: string, coursId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('module_progress')
    .select('module_id')
    .eq('user_id', userId)
    .eq('cours_id', coursId)
  if (error) throw error
  return new Set((data ?? []).map(r => r.module_id))
}
