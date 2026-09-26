import { supabase } from './supabase'
import { filtreAdmin, parishPublique } from './scope'

export type TypeDemande =
  | 'bapteme' | 'catechisme' | 'mariage' | 'obseques' | 'certificat'
  | 'intention_messe' | 'accompagnement' | 'benevolat' | 'info_generale'

export type StatutDemande = 'recue' | 'en_cours' | 'traitee' | 'archivee'

export const TYPE_DEMANDE_LABELS: Record<TypeDemande, string> = {
  bapteme: 'Baptême',
  catechisme: 'Inscription au catéchisme',
  mariage: 'Mariage',
  obseques: 'Obsèques',
  certificat: 'Certificat / attestation',
  intention_messe: 'Intention de messe',
  accompagnement: 'Accompagnement pastoral',
  benevolat: 'Bénévolat',
  info_generale: "Demande d'information",
}

export const STATUT_DEMANDE_LABELS: Record<StatutDemande, string> = {
  recue: 'Reçue',
  en_cours: 'En cours',
  traitee: 'Traitée',
  archivee: 'Archivée',
}

export interface DemandePastorale {
  id?: string
  reference: string
  type: TypeDemande
  nom: string
  contact: string
  message: string
  details?: Record<string, string>
  statut: StatutDemande
  assigneA?: string
  notesInternes?: string
  createdAt?: string
  updatedAt?: string
}

interface DemandeRow {
  id: string
  reference: string
  type: TypeDemande
  nom: string
  contact: string
  message: string
  details?: Record<string, string> | null
  statut: StatutDemande
  assigne_a: string | null
  notes_internes: string | null
  created_at: string
  updated_at: string
}

function fromRow(r: DemandeRow): DemandePastorale {
  return {
    id: r.id, reference: r.reference, type: r.type, nom: r.nom, contact: r.contact,
    message: r.message, details: r.details ?? {}, statut: r.statut, assigneA: r.assigne_a ?? undefined,
    notesInternes: r.notes_internes ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function generateReference(): string {
  const now = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SC-${now}-${rand}`
}

export async function creerDemande(data: Pick<DemandePastorale, 'type' | 'nom' | 'contact' | 'message' | 'details'>): Promise<string> {
  const reference = generateReference()
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('demandes_pastorales').insert({
    ...parishPublique(), user_id: auth.user?.id ?? null,
    reference, type: data.type, nom: data.nom, contact: data.contact, message: data.message,
    details: data.details ?? {},
    statut: 'recue',
  })
  if (error) throw error
  return reference
}

export async function getDemandes(): Promise<DemandePastorale[]> {
  const { data, error } = await filtreAdmin(supabase.from('demandes_pastorales').select('*')).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function updateDemande(id: string, patch: Partial<Pick<DemandePastorale, 'statut' | 'assigneA' | 'notesInternes'>>): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.statut !== undefined) update.statut = patch.statut
  if (patch.assigneA !== undefined) update.assigne_a = patch.assigneA || null
  if (patch.notesInternes !== undefined) update.notes_internes = patch.notesInternes || null
  const { error } = await supabase.from('demandes_pastorales').update(update).eq('id', id)
  if (error) throw error
}

export async function deleteDemande(id: string): Promise<void> {
  const { error } = await supabase.from('demandes_pastorales').delete().eq('id', id)
  if (error) throw error
}

export async function getMesDemandes(userId: string): Promise<DemandePastorale[]> {
  const { data, error } = await supabase.from('demandes_pastorales').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export interface SuiviDemande {
  type: TypeDemande
  statut: StatutDemande
  createdAt: string
  updatedAt: string
}

/** Suivi sans compte : il faut la référence ET le contact saisis lors de la demande. */
export async function suivreDemande(reference: string, contact: string): Promise<SuiviDemande | null> {
  const { data, error } = await supabase.rpc('suivre_demande', { p_reference: reference, p_contact: contact })
  if (error) throw error
  const r = (data as { type: TypeDemande; statut: StatutDemande; created_at: string; updated_at: string }[] | null)?.[0]
  return r ? { type: r.type, statut: r.statut, createdAt: r.created_at, updatedAt: r.updated_at } : null
}

/** Champs spécifiques demandés selon le type de démarche. */
export const CHAMPS_DEMARCHE: Partial<Record<TypeDemande, { cle: string; label: string; type?: 'date' | 'text' }[]>> = {
  bapteme: [
    { cle: 'baptise', label: 'Nom de la personne à baptiser' },
    { cle: 'date_naissance', label: 'Date de naissance', type: 'date' },
    { cle: 'parents', label: 'Noms des parents (pour un enfant)' },
    { cle: 'parrain_marraine', label: 'Parrain et marraine' },
    { cle: 'date_souhaitee', label: 'Date souhaitée', type: 'date' },
  ],
  mariage: [
    { cle: 'fiance', label: 'Nom du fiancé' },
    { cle: 'fiancee', label: 'Nom de la fiancée' },
    { cle: 'baptises', label: 'Êtes-vous baptisés tous les deux ? (oui / non / l\'un des deux)' },
    { cle: 'date_souhaitee', label: 'Date souhaitée', type: 'date' },
  ],
  obseques: [
    { cle: 'defunt', label: 'Nom du défunt' },
    { cle: 'date_deces', label: 'Date du décès', type: 'date' },
    { cle: 'contact_famille', label: 'Personne à contacter dans la famille' },
    { cle: 'date_souhaitee', label: 'Date souhaitée pour les funérailles', type: 'date' },
  ],
  certificat: [
    { cle: 'sacrement', label: 'Certificat demandé (baptême, confirmation, mariage…)' },
    { cle: 'personne', label: 'Nom de la personne concernée' },
    { cle: 'date_sacrement', label: 'Date approximative du sacrement' },
  ],
  intention_messe: [
    { cle: 'intention', label: 'Intention (ex. repos de l\'âme de…)' },
    { cle: 'date_souhaitee', label: 'Date souhaitée', type: 'date' },
  ],
  catechisme: [
    { cle: 'enfant', label: 'Nom de l\'enfant' },
    { cle: 'age', label: 'Âge' },
  ],
}
