import { supabase } from './supabase'
import { logAudit } from './auditLog'

export type TagType = 'Liturgie' | 'Formation' | 'Prière' | 'Événement'

export interface Annonce {
  id?: string
  titre: string
  desc: string
  tag: TagType
  date: string        // ISO string
  imageUrl?: string
  imagePath?: string  // chemin Storage pour suppression
  epingle: boolean
  publie: boolean
  createdAt?: string
  updatedAt?: string
}

const TABLE = 'annonces'
const BUCKET = 'annonces'

interface AnnonceRow {
  id: string
  titre: string
  description: string
  tag: TagType
  date: string
  image_url: string | null
  image_path: string | null
  epingle: boolean
  publie: boolean
  created_at: string
  updated_at: string
}

function fromRow(r: AnnonceRow): Annonce {
  return {
    id: r.id, titre: r.titre, desc: r.description, tag: r.tag, date: r.date,
    imageUrl: r.image_url ?? undefined, imagePath: r.image_path ?? undefined,
    epingle: r.epingle, publie: r.publie, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getAnnonces(publieSeulement = true): Promise<Annonce[]> {
  let query = supabase.from(TABLE).select('*').order('date', { ascending: false })
  if (publieSeulement) query = query.eq('publie', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createAnnonce(data: Omit<Annonce, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(TABLE).insert({
    titre: data.titre, description: data.desc, tag: data.tag, date: data.date,
    image_url: data.imageUrl || null, image_path: data.imagePath || null,
    epingle: data.epingle, publie: data.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'annonce', row.id, data.titre)
  return row.id
}

export async function updateAnnonce(id: string, data: Partial<Annonce>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.desc !== undefined) patch.description = data.desc
  if (data.tag !== undefined) patch.tag = data.tag
  if (data.date !== undefined) patch.date = data.date
  if (data.imageUrl !== undefined) patch.image_url = data.imageUrl || null
  if (data.imagePath !== undefined) patch.image_path = data.imagePath || null
  if (data.epingle !== undefined) patch.epingle = data.epingle
  if (data.publie !== undefined) patch.publie = data.publie

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'annonce', id, data.titre)
}

export async function deleteAnnonce(id: string, imagePath?: string): Promise<void> {
  if (imagePath) {
    try { await supabase.storage.from(BUCKET).remove([imagePath]) } catch (_) { /* déjà supprimé */ }
  }
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'annonce', id)
}

export async function uploadAnnonceImage(file: File, annonceId: string): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()
  const path = `${annonceId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}
