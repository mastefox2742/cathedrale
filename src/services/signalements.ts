import { supabase } from './supabase'
import { logAudit } from './auditLog'

export type GraviteSignalement = 'faible' | 'moyenne' | 'elevee'
export type StatutSignalement = 'nouveau' | 'en_cours' | 'traite' | 'archive'

export const GRAVITE_LABELS: Record<GraviteSignalement, string> = {
  faible: 'Faible', moyenne: 'Moyenne', elevee: 'Élevée',
}

export const STATUT_SIGNALEMENT_LABELS: Record<StatutSignalement, string> = {
  nouveau: 'Nouveau', en_cours: 'En cours', traite: 'Traité', archive: 'Archivé',
}

export interface Signalement {
  id?: string
  concerne?: string
  description: string
  gravite?: GraviteSignalement
  statut: StatutSignalement
  reporterNom?: string
  reporterContact?: string
  enfantId?: string
  notesSuivi?: string
  createdAt?: string
  updatedAt?: string
}

const TABLE = 'signalements'

interface SignalementRow {
  id: string
  concerne: string | null
  description: string
  gravite: GraviteSignalement | null
  statut: StatutSignalement
  reporter_nom: string | null
  reporter_contact: string | null
  enfant_id: string | null
  notes_suivi: string | null
  created_at: string
  updated_at: string
}

function fromRow(r: SignalementRow): Signalement {
  return {
    id: r.id, concerne: r.concerne ?? undefined, description: r.description,
    gravite: r.gravite ?? undefined, statut: r.statut,
    reporterNom: r.reporter_nom ?? undefined, reporterContact: r.reporter_contact ?? undefined,
    enfantId: r.enfant_id ?? undefined, notesSuivi: r.notes_suivi ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

/** Soumission publique — pas de connexion requise, identité optionnelle (anonyme si vide). */
export async function creerSignalement(data: {
  concerne?: string; description: string; reporterNom?: string; reporterContact?: string
}): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    concerne: data.concerne || null, description: data.description,
    reporter_nom: data.reporterNom || null, reporter_contact: data.reporterContact || null,
  })
  if (error) throw error
}

/** Réservé admin / responsable sécurité (appliqué par les RLS). */
export async function getSignalements(): Promise<Signalement[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function updateSignalement(id: string, patch: Partial<Pick<Signalement, 'statut' | 'gravite' | 'notesSuivi' | 'enfantId'>>): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.statut !== undefined) update.statut = patch.statut
  if (patch.gravite !== undefined) update.gravite = patch.gravite || null
  if (patch.notesSuivi !== undefined) update.notes_suivi = patch.notesSuivi || null
  if (patch.enfantId !== undefined) update.enfant_id = patch.enfantId || null
  const { error } = await supabase.from(TABLE).update(update).eq('id', id)
  if (error) throw error
  await logAudit('update', 'signalement', id)
}
