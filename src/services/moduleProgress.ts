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

export async function getModulesTerminesTous(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('module_progress')
    .select('module_id')
    .eq('user_id', userId)
  if (error) throw error
  return new Set((data ?? []).map(r => r.module_id))
}

export async function marquerModuleTermine(userId: string, coursId: string, moduleId: string): Promise<void> {
  const { error } = await supabase
    .from('module_progress')
    .upsert({ user_id: userId, cours_id: coursId, module_id: moduleId }, { onConflict: 'user_id,module_id', ignoreDuplicates: true })
  if (error) throw error
}
