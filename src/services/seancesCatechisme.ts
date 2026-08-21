import { supabase } from './supabase'
import { logAudit } from './auditLog'

export type StatutSeance = 'planifiee' | 'faite' | 'annulee'

export const STATUT_SEANCE_LABELS: Record<StatutSeance, string> = {
  planifiee: 'Planifiée',
  faite: 'Faite',
  annulee: 'Annulée',
}

export interface SeanceCatechisme {
  id?: string
  coursId: string
  date: string
  objectifs: string
  notesPreparation?: string
  statut: StatutSeance
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

interface SeanceRow {
  id: string
  cours_id: string
  date: string
  objectifs: string
  notes_preparation: string | null
  statut: StatutSeance
  created_by: string | null
  created_at: string
  updated_at: string
}

function fromRow(r: SeanceRow): SeanceCatechisme {
  return {
    id: r.id, coursId: r.cours_id, date: r.date, objectifs: r.objectifs,
    notesPreparation: r.notes_preparation ?? undefined, statut: r.statut,
    createdBy: r.created_by ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getSeances(): Promise<SeanceCatechisme[]> {
  const { data, error } = await supabase.from('seances_catechisme').select('*').order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createSeance(data: Pick<SeanceCatechisme, 'coursId' | 'date' | 'objectifs' | 'notesPreparation'>): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  const { data: row, error } = await supabase.from('seances_catechisme').insert({
    cours_id: data.coursId, date: data.date, objectifs: data.objectifs,
    notes_preparation: data.notesPreparation || null, statut: 'planifiee',
    created_by: userData.user?.id ?? null,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'seance_catechisme', row.id, data.objectifs)
  return row.id
}

export async function updateSeance(id: string, data: Partial<Pick<SeanceCatechisme, 'coursId' | 'date' | 'objectifs' | 'notesPreparation' | 'statut'>>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.coursId !== undefined) patch.cours_id = data.coursId
  if (data.date !== undefined) patch.date = data.date
  if (data.objectifs !== undefined) patch.objectifs = data.objectifs
  if (data.notesPreparation !== undefined) patch.notes_preparation = data.notesPreparation || null
  if (data.statut !== undefined) patch.statut = data.statut
  const { error } = await supabase.from('seances_catechisme').update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'seance_catechisme', id, data.objectifs)
}

export async function deleteSeance(id: string): Promise<void> {
  const { error } = await supabase.from('seances_catechisme').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'seance_catechisme', id)
}
