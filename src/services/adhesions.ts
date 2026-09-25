import { supabase } from './supabase'
import { filtreAdmin } from './scope'
import { logAudit } from './auditLog'

export type StatutAdhesion = 'nouvelle' | 'acceptee' | 'refusee'

export const STATUT_ADHESION_LABELS: Record<StatutAdhesion, string> = {
  nouvelle: 'Nouvelle',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
}

export interface Adhesion {
  id: string
  groupeId: string
  nom: string
  contact: string
  message: string | null
  statut: StatutAdhesion
  createdAt: string
}

interface AdhesionRow {
  id: string; groupe_id: string; nom: string; contact: string; message: string | null
  statut: StatutAdhesion; created_at: string
}

function fromRow(r: AdhesionRow): Adhesion {
  return { id: r.id, groupeId: r.groupe_id, nom: r.nom, contact: r.contact, message: r.message, statut: r.statut, createdAt: r.created_at }
}

/** Demande d'adhésion publique : rattachée à la paroisse du groupe. */
export async function demanderAdhesion(groupeId: string, groupeParishId: string | null | undefined, d: { nom: string; contact: string; message?: string }): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('groupe_adhesions').insert({
    groupe_id: groupeId, ...(groupeParishId ? { parish_id: groupeParishId } : {}),
    user_id: auth.user?.id ?? null, nom: d.nom.trim(), contact: d.contact.trim(), message: d.message?.trim() || null,
  })
  if (error) throw error
}

export async function getAdhesions(): Promise<Adhesion[]> {
  const { data, error } = await filtreAdmin(supabase.from('groupe_adhesions').select('*')).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function setStatutAdhesion(id: string, statut: StatutAdhesion): Promise<void> {
  const { error } = await supabase.from('groupe_adhesions').update({ statut, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  await logAudit('update', 'adhesion', id, statut)
}

export async function deleteAdhesion(id: string): Promise<void> {
  const { error } = await supabase.from('groupe_adhesions').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'adhesion', id)
}
