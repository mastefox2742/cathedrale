import {
  collection, addDoc, deleteDoc, getDocs,
  query, where, serverTimestamp, type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export type CanalType = 'email' | 'whatsapp'

export interface Abonnement {
  id?: string
  canal: CanalType
  contact: string       // email ou numéro WhatsApp (+242...)
  prefs: {
    liturgie: boolean   // Évangile du jour
    annonces: boolean   // Annonces urgentes
    meditation: boolean // Méditation du soir
    newsletter: boolean // Newsletter hebdo (email seulement)
  }
  confirme: boolean
  createdAt?: Timestamp
}

const COL = 'abonnements'

export async function subscribe(data: Omit<Abonnement, 'id' | 'createdAt' | 'confirme'>): Promise<string> {
  // Vérifie doublon
  const existing = await getDocs(query(collection(db, COL), where('contact', '==', data.contact)))
  if (!existing.empty) return existing.docs[0].id

  const ref = await addDoc(collection(db, COL), {
    ...data,
    confirme: data.canal === 'whatsapp', // WhatsApp confirmé directement
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function unsubscribe(contact: string): Promise<void> {
  const snap = await getDocs(query(collection(db, COL), where('contact', '==', contact)))
  for (const d of snap.docs) await deleteDoc(d.ref)
}

export async function getAbonnements(): Promise<Abonnement[]> {
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Abonnement))
}
