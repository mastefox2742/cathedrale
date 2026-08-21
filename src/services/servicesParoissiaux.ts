import { supabase } from './supabase'
import { logAudit } from './auditLog'

export interface ServiceParoissial {
  id?: string
  nom: string
  description: string
  categorie: string
  contact?: string
  horaire?: string
  emoji: string
  publie: boolean
  createdAt?: string
  updatedAt?: string
}

interface ServiceRow {
  id: string
  nom: string
  description: string
  categorie: string
  contact: string | null
  horaire: string | null
  emoji: string
  publie: boolean
  created_at: string
  updated_at: string
}

function fromRow(r: ServiceRow): ServiceParoissial {
  return {
    id: r.id, nom: r.nom, description: r.description, categorie: r.categorie,
    contact: r.contact ?? undefined, horaire: r.horaire ?? undefined, emoji: r.emoji,
    publie: r.publie, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getServicesParoissiaux(onlyPublies = true): Promise<ServiceParoissial[]> {
  let query = supabase.from('services_paroissiaux').select('*').order('categorie')
  if (onlyPublies) query = query.eq('publie', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createServiceParoissial(data: Omit<ServiceParoissial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: row, error } = await supabase.from('services_paroissiaux').insert({
    nom: data.nom, description: data.description, categorie: data.categorie,
    contact: data.contact || null, horaire: data.horaire || null, emoji: data.emoji, publie: data.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'service_paroissial', row.id, data.nom)
  return row.id
}

export async function updateServiceParoissial(id: string, data: Partial<Omit<ServiceParoissial, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.nom !== undefined) patch.nom = data.nom
  if (data.description !== undefined) patch.description = data.description
  if (data.categorie !== undefined) patch.categorie = data.categorie
  if (data.contact !== undefined) patch.contact = data.contact || null
  if (data.horaire !== undefined) patch.horaire = data.horaire || null
  if (data.emoji !== undefined) patch.emoji = data.emoji
  if (data.publie !== undefined) patch.publie = data.publie
  const { error } = await supabase.from('services_paroissiaux').update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'service_paroissial', id, data.nom)
}

export async function deleteServiceParoissial(id: string): Promise<void> {
  const { error } = await supabase.from('services_paroissiaux').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'service_paroissial', id)
}
