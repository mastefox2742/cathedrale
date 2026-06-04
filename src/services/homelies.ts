import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, type Timestamp, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

export interface Homelie {
  id?: string
  titre: string
  pretre: string
  date: string
  texte: string
  audioUrl?: string
  audioPath?: string
  liturgieRef?: string  // ex: "Jn 6, 41-51"
  publie: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const COL = 'homelies'

export async function getHomelies(publieSeulement = true): Promise<Homelie[]> {
  const q = publieSeulement
    ? query(collection(db, COL), where('publie', '==', true), orderBy('date', 'desc'))
    : query(collection(db, COL), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Homelie))
}

export async function createHomelie(data: Omit<Homelie, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref_ = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref_.id
}

export async function updateHomelie(id: string, data: Partial<Homelie>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteHomelie(id: string, audioPath?: string): Promise<void> {
  if (audioPath) {
    try { await deleteObject(ref(storage, audioPath)) } catch (_) { /* déjà supprimé */ }
  }
  await deleteDoc(doc(db, COL, id))
}

export async function uploadAudio(file: File, homelieId: string): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()
  const path = `homelies/${homelieId}/${Date.now()}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  return { url, path }
}
