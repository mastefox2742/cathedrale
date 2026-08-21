import { supabase } from './supabase'
import { logAudit } from './auditLog'

export type TypeConsentement = 'participation_activites' | 'droit_image' | 'sortie'

export const TYPE_CONSENTEMENT_LABELS: Record<TypeConsentement, string> = {
  participation_activites: 'Participation aux activités',
  droit_image: "Droit à l'image",
  sortie: 'Sorties',
}

export interface Enfant {
  id?: string
  prenom: string
  nom: string
  dateNaissance?: string
  parentNom: string
  parentContact: string
  parentProfileId?: string
  coursId?: string
  demandeId?: string
  notes?: string
  actif: boolean
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface ConsentementParental {
  id?: string
  enfantId: string
  type: TypeConsentement
  accorde: boolean
  dateSignature: string
  signataire: string
  notes?: string
  createdAt?: string
}

const ENFANTS_TABLE = 'enfants'
const CONSENTEMENTS_TABLE = 'consentements_parentaux'

interface EnfantRow {
  id: string
  prenom: string
  nom: string
  date_naissance: string | null
  parent_nom: string
  parent_contact: string
  parent_profile_id: string | null
  cours_id: string | null
  demande_id: string | null
  notes: string | null
  actif: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

function enfantFromRow(r: EnfantRow): Enfant {
  return {
    id: r.id, prenom: r.prenom, nom: r.nom, dateNaissance: r.date_naissance ?? undefined,
    parentNom: r.parent_nom, parentContact: r.parent_contact,
    parentProfileId: r.parent_profile_id ?? undefined, coursId: r.cours_id ?? undefined,
    demandeId: r.demande_id ?? undefined, notes: r.notes ?? undefined, actif: r.actif,
    createdBy: r.created_by ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

interface ConsentementRow {
  id: string
  enfant_id: string
  type: TypeConsentement
  accorde: boolean
  date_signature: string
  signataire: string
  notes: string | null
  created_at: string
}

function consentementFromRow(r: ConsentementRow): ConsentementParental {
  return {
    id: r.id, enfantId: r.enfant_id, type: r.type, accorde: r.accorde,
    dateSignature: r.date_signature, signataire: r.signataire,
    notes: r.notes ?? undefined, createdAt: r.created_at,
  }
}

export async function getEnfants(): Promise<Enfant[]> {
  const { data, error } = await supabase.from(ENFANTS_TABLE).select('*').order('nom')
  if (error) throw error
  return (data ?? []).map(enfantFromRow)
}

export async function addEnfant(data: Omit<Enfant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: user } = await supabase.auth.getUser()
  const { data: row, error } = await supabase.from(ENFANTS_TABLE).insert({
    prenom: data.prenom, nom: data.nom, date_naissance: data.dateNaissance || null,
    parent_nom: data.parentNom, parent_contact: data.parentContact,
    parent_profile_id: data.parentProfileId || null, cours_id: data.coursId || null,
    demande_id: data.demandeId || null, notes: data.notes || null, actif: data.actif,
    created_by: user.user?.id ?? null,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'enfant', row.id, `${data.prenom} ${data.nom}`)
  return row.id
}

export async function updateEnfant(id: string, data: Partial<Enfant>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.prenom !== undefined) patch.prenom = data.prenom
  if (data.nom !== undefined) patch.nom = data.nom
  if (data.dateNaissance !== undefined) patch.date_naissance = data.dateNaissance || null
  if (data.parentNom !== undefined) patch.parent_nom = data.parentNom
  if (data.parentContact !== undefined) patch.parent_contact = data.parentContact
  if (data.coursId !== undefined) patch.cours_id = data.coursId || null
  if (data.notes !== undefined) patch.notes = data.notes || null
  if (data.actif !== undefined) patch.actif = data.actif

  const { error } = await supabase.from(ENFANTS_TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'enfant', id, data.nom ? `${data.prenom ?? ''} ${data.nom}`.trim() : undefined)
}

export async function getConsentements(enfantId: string): Promise<ConsentementParental[]> {
  const { data, error } = await supabase.from(CONSENTEMENTS_TABLE).select('*')
    .eq('enfant_id', enfantId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(consentementFromRow)
}

export async function upsertConsentement(data: Omit<ConsentementParental, 'id' | 'createdAt'>): Promise<void> {
  const { data: user } = await supabase.auth.getUser()
  const { error } = await supabase.from(CONSENTEMENTS_TABLE).insert({
    enfant_id: data.enfantId, type: data.type, accorde: data.accorde,
    date_signature: data.dateSignature, signataire: data.signataire,
    notes: data.notes || null, created_by: user.user?.id ?? null,
  })
  if (error) throw error
  await logAudit(data.accorde ? 'create' : 'update', 'consentement', data.enfantId, `${data.type} : ${data.accorde ? 'accordé' : 'refusé'}`)
}
