import { supabase } from './supabase'

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
  statut: StatutDemande
  assigne_a: string | null
  notes_internes: string | null
  created_at: string
  updated_at: string
}

function fromRow(r: DemandeRow): DemandePastorale {
  return {
    id: r.id, reference: r.reference, type: r.type, nom: r.nom, contact: r.contact,
    message: r.message, statut: r.statut, assigneA: r.assigne_a ?? undefined,
    notesInternes: r.notes_internes ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function generateReference(): string {
  const now = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SC-${now}-${rand}`
}

export async function creerDemande(data: Pick<DemandePastorale, 'type' | 'nom' | 'contact' | 'message'>): Promise<string> {
  const reference = generateReference()
  const { error } = await supabase.from('demandes_pastorales').insert({
    reference, type: data.type, nom: data.nom, contact: data.contact, message: data.message,
    statut: 'recue',
  })
  if (error) throw error
  return reference
}

export async function getDemandes(): Promise<DemandePastorale[]> {
  const { data, error } = await supabase.from('demandes_pastorales').select('*').order('created_at', { ascending: false })
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
