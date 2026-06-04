import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export type Role = 'admin' | 'redacteur' | 'catechiste'

export interface UserProfile {
  uid: string
  email: string
  nom: string
  role: Role
  actif: boolean
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const profile = await getUserProfile(cred.user.uid)
  if (!profile) throw new Error('Profil introuvable. Contactez l\'administrateur.')
  if (!profile.actif) throw new Error('Compte désactivé. Contactez l\'administrateur.')
  return profile
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid, ...snap.data() } as UserProfile
}

export async function createUserProfile(user: User, data: Omit<UserProfile, 'uid'>): Promise<void> {
  await setDoc(doc(db, 'users', user.uid), data)
}

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb)
}
