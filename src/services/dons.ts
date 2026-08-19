import {
  collection, addDoc, getDocs, query, orderBy,
  serverTimestamp, type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

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
  createdAt?: Timestamp
}

export interface ProjetDon {
  id?: string
  titre: string
  description: string
  objectif: number     // En XAF
  collecte: number
  image?: string
  actif: boolean
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
  const ref = await addDoc(collection(db, 'dons'), {
    ...data,
    reference,
    statut: 'en_attente',
    createdAt: serverTimestamp(),
  })
  return reference
}

export async function getDons(): Promise<Don[]> {
  const snap = await getDocs(query(collection(db, 'dons'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Don))
}

export function formatXAF(montant: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(montant)
}
