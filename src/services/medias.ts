import {
  collection, doc, getDocs, addDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, type Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

export type MediaType = 'photo' | 'document' | 'audio' | 'video'

export interface Media {
  id?: string
  nom: string
  type: MediaType
  url: string
  storagePath?: string   // null pour les vidéos (URL externe)
  taille?: number        // bytes
  categorie: string
  description?: string
  createdAt?: Timestamp
}

const COL = 'medias'

export async function getMedias(type?: MediaType): Promise<Media[]> {
  const q = type
    ? query(collection(db, COL), where('type', '==', type), orderBy('createdAt', 'desc'))
    : query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Media))
}

export async function addMedia(data: Omit<Media, 'id' | 'createdAt'>): Promise<string> {
  const ref_ = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() })
  return ref_.id
}

export async function deleteMedia(id: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    try { await deleteObject(ref(storage, storagePath)) } catch (_) {}
  }
  await deleteDoc(doc(db, COL, id))
}

export function uploadMedia(
  file: File,
  folder: string,
  onProgress: (pct: number) => void,
): Promise<{ url: string; path: string }> {
  return new Promise((resolve, reject) => {
    const path = `medias/${folder}/${Date.now()}_${file.name}`
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      snap => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, path })
      },
    )
  })
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
