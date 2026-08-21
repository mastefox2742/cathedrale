import { supabase } from './supabase'
import { logAudit } from './auditLog'

export interface Homelie {
  id?: string
  titre: string
  pretre: string
  date: string
  texte: string
  audioUrl?: string
  audioPath?: string
  liturgieRef?: string
  publie: boolean
  createdAt?: string
  updatedAt?: string
}

const TABLE = 'homelies'
const BUCKET = 'homelies'

interface HomelieRow {
  id: string
  titre: string
  pretre: string
  date: string
  texte: string
  audio_url: string | null
  audio_path: string | null
  liturgie_ref: string | null
  publie: boolean
  created_at: string
  updated_at: string
}

function fromRow(r: HomelieRow): Homelie {
  return {
    id: r.id, titre: r.titre, pretre: r.pretre, date: r.date, texte: r.texte,
    audioUrl: r.audio_url ?? undefined, audioPath: r.audio_path ?? undefined,
    liturgieRef: r.liturgie_ref ?? undefined,
    publie: r.publie, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getHomelies(publieSeulement = true): Promise<Homelie[]> {
  let query = supabase.from(TABLE).select('*').order('date', { ascending: false })
  if (publieSeulement) query = query.eq('publie', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createHomelie(data: Omit<Homelie, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(TABLE).insert({
    titre: data.titre, pretre: data.pretre, date: data.date, texte: data.texte,
    audio_url: data.audioUrl || null, audio_path: data.audioPath || null,
    liturgie_ref: data.liturgieRef || null, publie: data.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'homelie', row.id, data.titre)
  return row.id
}

export async function updateHomelie(id: string, data: Partial<Homelie>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.pretre !== undefined) patch.pretre = data.pretre
  if (data.date !== undefined) patch.date = data.date
  if (data.texte !== undefined) patch.texte = data.texte
  if (data.audioUrl !== undefined) patch.audio_url = data.audioUrl || null
  if (data.audioPath !== undefined) patch.audio_path = data.audioPath || null
  if (data.liturgieRef !== undefined) patch.liturgie_ref = data.liturgieRef || null
  if (data.publie !== undefined) patch.publie = data.publie

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'homelie', id, data.titre)
}

export async function deleteHomelie(id: string, audioPath?: string): Promise<void> {
  if (audioPath) {
    try { await supabase.storage.from(BUCKET).remove([audioPath]) } catch (_) { /* déjà supprimé */ }
  }
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'homelie', id)
}

export async function uploadAudio(file: File, homelieId: string): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()
  const path = `${homelieId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}
