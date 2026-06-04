import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Formation {
  id?: string
  titre: string
  description: string
  tranche: string   // ex: "6 – 8 ans"
  modules: number
  accent: string    // couleur CSS
  icon: string      // material symbol
  actif: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const COL = 'formations'

export async function getFormations(): Promise<Formation[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Formation))
}

export async function createFormation(data: Omit<Formation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref_ = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref_.id
}

export async function updateFormation(id: string, data: Partial<Formation>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteFormation(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
