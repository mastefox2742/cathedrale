import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export type EvenementType = 'live' | 'replay' | 'evenement'
export type PlatformType = 'youtube' | 'facebook'

export interface Evenement {
  id?: string
  titre: string
  description: string
  type: EvenementType
  platform: PlatformType
  url: string                // URL YouTube ou Facebook
  videoId?: string           // ID extrait pour l'embed
  thumbnail?: string
  date: string               // ISO date
  heure?: string
  estEnLive?: boolean
  publie: boolean
  createdAt?: Timestamp
}

const COL = 'evenements'

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ]
  for (const p of patterns) {
    const m = p.exec(url)
    if (m) return m[1]
  }
  return null
}

function extractFacebookVideoId(url: string): string | null {
  const m = /\/videos\/(\d+)/.exec(url)
  return m ? m[1] : null
}

export function enrichEvenement(data: Omit<Evenement, 'id' | 'createdAt'>): Omit<Evenement, 'id' | 'createdAt'> {
  if (data.platform === 'youtube') {
    const id = extractYoutubeId(data.url)
    return {
      ...data,
      videoId: id ?? undefined,
      thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined,
    }
  }
  if (data.platform === 'facebook') {
    const id = extractFacebookVideoId(data.url)
    return { ...data, videoId: id ?? undefined }
  }
  return data
}

export async function getEvenements(type?: EvenementType): Promise<Evenement[]> {
  const q = type
    ? query(collection(db, COL), where('publie', '==', true), where('type', '==', type), orderBy('date', 'desc'))
    : query(collection(db, COL), where('publie', '==', true), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Evenement))
}

export async function getAllEvenements(): Promise<Evenement[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Evenement))
}

export async function addEvenement(data: Omit<Evenement, 'id' | 'createdAt'>): Promise<string> {
  const enriched = enrichEvenement(data)
  const ref = await addDoc(collection(db, COL), { ...enriched, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateEvenement(id: string, data: Partial<Evenement>): Promise<void> {
  const enriched = data.url ? enrichEvenement(data as Omit<Evenement, 'id' | 'createdAt'>) : data
  await updateDoc(doc(db, COL, id), enriched)
}

export async function deleteEvenement(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
