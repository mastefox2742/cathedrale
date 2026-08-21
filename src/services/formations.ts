import { supabase } from './supabase'
import { logAudit } from './auditLog'

export interface Formation {
  id?: string
  titre: string
  description: string
  tranche: string   // ex: "6 – 8 ans"
  modules: number
  accent: string    // couleur CSS
  icon: string      // material symbol
  actif: boolean
  createdAt?: string
  updatedAt?: string
}

const TABLE = 'formations'

interface FormationRow {
  id: string
  titre: string
  description: string
  tranche: string
  modules: number
  accent: string
  icon: string
  actif: boolean
  created_at: string
  updated_at: string
}

function fromRow(r: FormationRow): Formation {
  return {
    id: r.id, titre: r.titre, description: r.description, tranche: r.tranche,
    modules: r.modules, accent: r.accent, icon: r.icon, actif: r.actif,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getFormations(): Promise<Formation[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createFormation(data: Omit<Formation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(TABLE).insert({
    titre: data.titre, description: data.description, tranche: data.tranche,
    modules: data.modules, accent: data.accent, icon: data.icon, actif: data.actif,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'formation', row.id, data.titre)
  return row.id
}

export async function updateFormation(id: string, data: Partial<Formation>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.description !== undefined) patch.description = data.description
  if (data.tranche !== undefined) patch.tranche = data.tranche
  if (data.modules !== undefined) patch.modules = data.modules
  if (data.accent !== undefined) patch.accent = data.accent
  if (data.icon !== undefined) patch.icon = data.icon
  if (data.actif !== undefined) patch.actif = data.actif

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'formation', id, data.titre)
}

export async function deleteFormation(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'formation', id)
}
