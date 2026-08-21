import { supabase } from './supabase'

export type StatutIntention = 'recue' | 'en_cours' | 'traitee' | 'archivee'

export const STATUT_INTENTION_LABELS: Record<StatutIntention, string> = {
  recue: 'Reçue',
  en_cours: 'En cours',
  traitee: 'Traitée',
  archivee: 'Archivée',
}

export interface PrayerIntention {
  id: string
  user_id: string
  contenu: string
  is_public: boolean
  created_at: string
}

export interface PrayerIntentionAdmin extends PrayerIntention {
  estAnonyme: boolean
  statut: StatutIntention
  assigneA?: string
  notesInternes?: string
  updatedAt: string
  auteurNom?: string
  auteurEmail?: string
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

export async function getIntentionsAdmin(): Promise<PrayerIntentionAdmin[]> {
  const [{ data, error }, { data: profils, error: errProfils }] = await Promise.all([
    supabase.from('prayer_intentions').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, nom, email'),
  ])
  if (error) throw error
  if (errProfils) throw errProfils
  const profilsById = new Map((profils ?? []).map(p => [p.id, p]))
  return (data ?? []).map((r) => {
    const auteur = profilsById.get(r.user_id)
    return {
      id: r.id, user_id: r.user_id, contenu: r.contenu, is_public: r.is_public, created_at: r.created_at,
      estAnonyme: r.est_anonyme, statut: r.statut, assigneA: r.assigne_a ?? undefined,
      notesInternes: r.notes_internes ?? undefined, updatedAt: r.updated_at,
      auteurNom: auteur?.nom ?? undefined, auteurEmail: auteur?.email ?? undefined,
    }
  })
}

export async function updateIntention(id: string, patch: Partial<Pick<PrayerIntentionAdmin, 'statut' | 'assigneA' | 'notesInternes'>>): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.statut !== undefined) update.statut = patch.statut
  if (patch.assigneA !== undefined) update.assigne_a = patch.assigneA || null
  if (patch.notesInternes !== undefined) update.notes_internes = patch.notesInternes || null
  const { error } = await supabase.from('prayer_intentions').update(update).eq('id', id)
  if (error) throw error
}

export async function deleteIntention(id: string): Promise<void> {
  const { error } = await supabase.from('prayer_intentions').delete().eq('id', id)
  if (error) throw error
}
