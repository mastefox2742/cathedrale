import { supabase } from './supabase'
import { logAudit } from './auditLog'

export interface Groupe {
  id?: string
  titre: string
  description: string
  categorie: string
  responsable?: string
  horaire?: string
  contact?: string
  icon: string
  publie: boolean
  createdAt?: string
  updatedAt?: string
}

const TABLE = 'groupes'

interface GroupeRow {
  id: string
  titre: string
  description: string
  categorie: string
  responsable: string | null
  horaire: string | null
  contact: string | null
  icon: string
  publie: boolean
  created_at: string
  updated_at: string
}

function fromRow(r: GroupeRow): Groupe {
  return {
    id: r.id, titre: r.titre, description: r.description, categorie: r.categorie,
    responsable: r.responsable ?? undefined, horaire: r.horaire ?? undefined,
    contact: r.contact ?? undefined, icon: r.icon, publie: r.publie,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getGroupes(publieSeulement = true): Promise<Groupe[]> {
  let query = supabase.from(TABLE).select('*').order('titre')
  if (publieSeulement) query = query.eq('publie', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createGroupe(data: Omit<Groupe, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(TABLE).insert({
    titre: data.titre, description: data.description, categorie: data.categorie,
    responsable: data.responsable || null, horaire: data.horaire || null,
    contact: data.contact || null, icon: data.icon, publie: data.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'groupe', row.id, data.titre)
  return row.id
}

export async function updateGroupe(id: string, data: Partial<Groupe>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.description !== undefined) patch.description = data.description
  if (data.categorie !== undefined) patch.categorie = data.categorie
  if (data.responsable !== undefined) patch.responsable = data.responsable || null
  if (data.horaire !== undefined) patch.horaire = data.horaire || null
  if (data.contact !== undefined) patch.contact = data.contact || null
  if (data.icon !== undefined) patch.icon = data.icon
  if (data.publie !== undefined) patch.publie = data.publie

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'groupe', id, data.titre)
}

export async function deleteGroupe(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'groupe', id)
}
