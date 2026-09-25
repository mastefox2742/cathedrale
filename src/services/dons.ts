import { supabase } from './supabase'
import { filtrePublic, filtreAdmin, parishIdPourCreation, parishPublique } from './scope'
import { logAudit } from './auditLog'

export type MethodePaiement = 'mtn' | 'airtel' | 'carte' | 'virement'
export type TypeDon = 'libre' | 'denier' | 'messe' | 'projet' | 'dime'

export interface Don {
  id?: string
  montant: number
  devise: 'XAF'        // Franc CFA
  methode: MethodePaiement
  type: TypeDon
  intention?: string   // Pour les intentions de messe
  projetId?: string    // Pour les dons affectés
  nomDonateur?: string
  emailDonateur?: string
  reference: string    // Référence unique
  statut: 'en_attente' | 'confirme' | 'echec'
  parishId?: string | null
  createdAt?: string
}

interface DonRow {
  id: string
  montant: number
  devise: 'XAF'
  methode: MethodePaiement
  type: TypeDon
  intention: string | null
  projet_id: string | null
  nom_donateur: string | null
  email_donateur: string | null
  reference: string
  statut: 'en_attente' | 'confirme' | 'echec'
  parish_id?: string | null
  created_at: string
}

function fromRow(r: DonRow): Don {
  return {
    id: r.id, montant: r.montant, devise: r.devise, methode: r.methode, type: r.type,
    intention: r.intention ?? undefined, projetId: r.projet_id ?? undefined,
    nomDonateur: r.nom_donateur ?? undefined, emailDonateur: r.email_donateur ?? undefined,
    reference: r.reference, statut: r.statut, parishId: r.parish_id ?? null, createdAt: r.created_at,
  }
}

export interface ProjetDon {
  id?: string
  titre: string
  description: string
  objectif: number     // En XAF
  collecte: number      // calculé à partir des dons confirmés, jamais stocké
  emoji: string
  publie: boolean
  createdAt?: string
  updatedAt?: string
}

interface ProjetDonRow {
  id: string
  titre: string
  description: string
  objectif: number
  emoji: string
  publie: boolean
  created_at: string
  updated_at: string
}

function fromProjetRow(r: ProjetDonRow, collecte: number): ProjetDon {
  return {
    id: r.id, titre: r.titre, description: r.description, objectif: r.objectif,
    collecte, emoji: r.emoji, publie: r.publie, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

async function getCollecteParProjet(): Promise<Map<string, number>> {
  // Fonction SQL : le public n'a pas le droit de lire la table des dons.
  const { data, error } = await supabase.rpc('collecte_projets')
  if (error) return new Map() // les projets restent affichés, montants à 0
  return new Map((data as { projet_id: string; total: number }[] ?? []).map(d => [d.projet_id, Number(d.total)]))
}

export async function getProjetsDons(onlyPublies = true): Promise<ProjetDon[]> {
  let query = supabase.from('projets_dons').select('*').order('created_at', { ascending: true })
  query = onlyPublies ? filtrePublic(query.eq('publie', true)) : filtreAdmin(query)
  const [{ data, error }, totaux] = await Promise.all([query, getCollecteParProjet()])
  if (error) throw error
  return (data ?? []).map(r => fromProjetRow(r, totaux.get(r.id) ?? 0))
}

export async function createProjetDon(data: Omit<ProjetDon, 'id' | 'collecte' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: row, error } = await supabase.from('projets_dons').insert({
    parish_id: parishIdPourCreation(),
    titre: data.titre, description: data.description, objectif: data.objectif,
    emoji: data.emoji, publie: data.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'projet_don', row.id, data.titre)
  return row.id
}

export async function updateProjetDon(id: string, data: Partial<Omit<ProjetDon, 'id' | 'collecte' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.description !== undefined) patch.description = data.description
  if (data.objectif !== undefined) patch.objectif = data.objectif
  if (data.emoji !== undefined) patch.emoji = data.emoji
  if (data.publie !== undefined) patch.publie = data.publie
  const { error } = await supabase.from('projets_dons').update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'projet_don', id, data.titre)
}

export async function deleteProjetDon(id: string): Promise<void> {
  const { error } = await supabase.from('projets_dons').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'projet_don', id)
}

// Numéros Mobile Money officiels de la cathédrale
export const MOBILE_MONEY_CONFIG = {
  mtn: {
    label: 'MTN Mobile Money',
    numero: '+242 06 XXX XXXX',   // À remplacer par le vrai numéro
    nom: 'Cathédrale Sacré-Cœur',
    color: '#FFCC00',
    textColor: '#333',
    logo: '🟡',
  },
  airtel: {
    label: 'Airtel Money',
    numero: '+242 05 XXX XXXX',   // À remplacer par le vrai numéro
    nom: 'Archidiocèse Brazzaville',
    color: '#E40000',
    textColor: '#fff',
    logo: '🔴',
  },
}

export const MONTANTS_SUGGERES = [500, 1000, 2500, 5000, 10000, 25000]

export const TYPE_DON_LABELS: Record<TypeDon, { label: string; icon: string; desc: string }> = {
  libre:   { label: 'Don libre',           icon: '💝', desc: 'Montant au choix' },
  denier:  { label: 'Denier de l\'Église', icon: '⛪', desc: 'Contribution annuelle' },
  messe:   { label: 'Intention de messe',  icon: '✝️', desc: 'Demander une messe' },
  projet:  { label: 'Soutien projet',      icon: '🏗️', desc: 'Rénovation, bourses...' },
  dime:    { label: 'Dîme & offrande',     icon: '🙏', desc: 'Offrande régulière' },
}

function generateReference(): string {
  const now = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SC-${now}-${rand}`
}

export async function enregistrerDon(data: Omit<Don, 'id' | 'createdAt' | 'reference' | 'statut'>): Promise<string> {
  const reference = generateReference()
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('dons').insert({
    ...parishPublique(), user_id: auth.user?.id ?? null,
    montant: data.montant, devise: data.devise, methode: data.methode, type: data.type,
    intention: data.intention || null, projet_id: data.projetId || null,
    nom_donateur: data.nomDonateur || null, email_donateur: data.emailDonateur || null,
    reference, statut: 'en_attente',
  })
  if (error) throw error
  return reference
}

export async function getDons(): Promise<Don[]> {
  const { data, error } = await filtreAdmin(supabase.from('dons').select('*')).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export function formatXAF(montant: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(montant)
}

export async function updateStatutDon(id: string, statut: Don['statut']): Promise<void> {
  const { error } = await supabase.from('dons').update({ statut }).eq('id', id)
  if (error) throw error
  await logAudit('update', 'don', id, statut)
}

export async function getMesDons(userId: string): Promise<Don[]> {
  const { data, error } = await supabase.from('dons').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export const STATUT_DON_LABELS: Record<Don['statut'], string> = {
  en_attente: 'En attente',
  confirme: 'Confirmé',
  echec: 'Échec',
}

export const METHODE_LABELS: Record<MethodePaiement, string> = {
  mtn: 'MTN Mobile Money',
  airtel: 'Airtel Money',
  carte: 'Carte bancaire',
  virement: 'Virement',
}
