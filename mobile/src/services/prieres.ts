import { supabase } from './supabase'
import { filtreParoisse, getParoisseCourante } from './paroisses'

export interface PrayerIntention {
  id: string
  user_id: string
  contenu: string
  is_public: boolean
  nb_prieres?: number
  created_at: string
}

export async function getIntentionsPubliques(): Promise<PrayerIntention[]> {
  const { data, error } = await filtreParoisse(supabase
    .from('prayer_intentions')
    .select('*')
    .eq('is_public', true))
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function deposerIntention(userId: string, contenu: string, isPublic: boolean, estAnonyme = false): Promise<void> {
  const { error } = await supabase
    .from('prayer_intentions')
    .insert({ ...(getParoisseCourante() ? { parish_id: getParoisseCourante() } : {}), user_id: userId, contenu, is_public: isPublic, est_anonyme: estAnonyme })
  if (error) throw error
}

/** « Je prie pour cette intention » — renvoie le nouveau compteur. */
export async function prierPour(id: string): Promise<number> {
  const { data, error } = await supabase.rpc('prier_pour', { p_id: id })
  if (error) throw error
  return (data as number | null) ?? 0
}
