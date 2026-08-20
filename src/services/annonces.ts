import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, type Timestamp, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

export type TagType = 'Liturgie' | 'Formation' | 'Prière' | 'Événement'

export interface Annonce {
  id?: string
  titre: string
  desc: string
  tag: TagType
  date: string        // ISO string
  imageUrl?: string
  imagePath?: string  // chemin Storage pour suppression
  epingle: boolean
  publie: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const COL = 'annonces'

export async function getAnnonces(publieSeulement = true): Promise<Annonce[]> {
  const q = publieSeulement
    ? query(collection(db, COL), where('publie', '==', true), orderBy('date', 'desc'))
    : query(collection(db, COL), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Annonce))
}

export async function createAnnonce(data: Omit<Annonce, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref_ = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref_.id
}

export async function updateAnnonce(id: string, data: Partial<Annonce>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteAnnonce(id: string, imagePath?: string): Promise<void> {
  if (imagePath) {
    try { await deleteObject(ref(storage, imagePath)) } catch (_) { /* déjà supprimé */ }
  }
  await deleteDoc(doc(db, COL, id))
}

export async function uploadAnnonceImage(file: File, annonceId: string): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()
  const path = `annonces/${annonceId}/${Date.now()}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  return { url, path }
}
