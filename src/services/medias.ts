import { supabase } from './supabase'
import { logAudit } from './auditLog'

export type MediaType = 'photo' | 'document' | 'audio' | 'video'

export interface Media {
  id?: string
  nom: string
  type: MediaType
  url: string
  storagePath?: string   // null pour les vidéos (URL externe)
  taille?: number        // bytes
  categorie: string
  description?: string
  createdAt?: string
}

const TABLE = 'medias'
const BUCKET = 'medias'

interface MediaRow {
  id: string
  nom: string
  type: MediaType
  url: string
  storage_path: string | null
  taille: number | null
  categorie: string
  description: string | null
  created_at: string
}

function fromRow(r: MediaRow): Media {
  return {
    id: r.id, nom: r.nom, type: r.type, url: r.url,
    storagePath: r.storage_path ?? undefined, taille: r.taille ?? undefined,
    categorie: r.categorie, description: r.description ?? undefined, createdAt: r.created_at,
  }
}

// Bucket "medias" privé (réservé au staff) : les URLs stockées expirent, on les
// régénère systématiquement à la lecture plutôt que de faire confiance à une valeur figée.
async function withFreshUrl(r: MediaRow): Promise<Media> {
  if (r.storage_path) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, 3600)
    if (data?.signedUrl) return fromRow({ ...r, url: data.signedUrl })
  }
  return fromRow(r)
}

export async function getMedias(type?: MediaType): Promise<Media[]> {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false })
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return Promise.all((data ?? []).map(withFreshUrl))
}

export async function addMedia(data: Omit<Media, 'id' | 'createdAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(TABLE).insert({
    nom: data.nom, type: data.type, url: data.url, storage_path: data.storagePath || null,
    taille: data.taille ?? null, categorie: data.categorie, description: data.description || null,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'media', row.id, data.nom)
  return row.id
}

export async function deleteMedia(id: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    try { await supabase.storage.from(BUCKET).remove([storagePath]) } catch (_) {}
  }
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'media', id)
}

export function uploadMedia(
  file: File,
  folder: string,
  onProgress: (pct: number) => void,
): Promise<{ url: string; path: string }> {
  return new Promise((resolve, reject) => {
    const path = `${folder}/${Date.now()}_${file.name}`
    onProgress(10)
    supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
      .then(async ({ error }) => {
        if (error) { reject(error); return }
        onProgress(100)
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
        resolve({ url: data?.signedUrl ?? '', path })
      })
      .catch(reject)
  })
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
