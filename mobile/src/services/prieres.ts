import { supabase } from './supabase'

export interface PrayerIntention {
  id: string
  user_id: string
  contenu: string
  is_public: boolean
  created_at: string
}

export async function getIntentionsPubliques(): Promise<PrayerIntention[]> {
  const { data, error } = await supabase
    .from('prayer_intentions')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function deposerIntention(userId: string, contenu: string, isPublic: boolean, estAnonyme = false): Promise<void> {
  const { error } = await supabase
    .from('prayer_intentions')
    .insert({ user_id: userId, contenu, is_public: isPublic, est_anonyme: estAnonyme })
  if (error) throw error
}
