import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Role =
  | 'admin' | 'redacteur' | 'catechiste' | 'pretre' | 'secretariat' | 'tresorier'
  | 'responsable_groupe' | 'animateur_jeunesse' | 'responsable_securite' | 'responsable_liturgie'
  | 'parent' | 'benevole' | 'membre'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  redacteur: 'Rédacteur',
  catechiste: 'Catéchiste',
  pretre: 'Prêtre',
  secretariat: 'Secrétariat',
  tresorier: 'Trésorier',
  responsable_groupe: 'Responsable de groupe',
  animateur_jeunesse: 'Animateur Jeunesse',
  responsable_securite: 'Responsable sécurité',
  responsable_liturgie: 'Responsable liturgie',
  parent: 'Parent',
  benevole: 'Bénévole',
  membre: 'Membre',
}

/** Rôles opérationnels — donnent accès au panneau d'administration. */
export const STAFF_ROLES: Role[] = [
  'admin', 'redacteur', 'catechiste', 'pretre', 'secretariat', 'tresorier',
  'responsable_groupe', 'animateur_jeunesse', 'responsable_securite', 'responsable_liturgie',
]

export function isStaffRole(role: Role | null): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

/** Rôles ayant un besoin opérationnel réel de voir des dossiers enfants (protection des mineurs). */
const PROTECTION_MINEURS_ROLES: Role[] = ['admin', 'responsable_securite', 'catechiste', 'secretariat']

export function canManageEnfants(role: Role | null): boolean {
  return !!role && PROTECTION_MINEURS_ROLES.includes(role)
}

/** Signalements : plus restreint — jamais catéchiste/secrétariat, un signalement peut les concerner. */
export function canViewSignalements(role: Role | null): boolean {
  return role === 'admin' || role === 'responsable_securite'
}

export interface UserProfile {
  uid: string
  email: string
  nom: string | null
  role: Role | null
  actif: boolean
  verifieSecurite?: boolean
  dateVerification?: string | null
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  const profile = await getUserProfile(data.user.id)
  if (!profile) {
    await supabase.auth.signOut()
    throw new Error('Profil introuvable. Contactez l\'administrateur.')
  }
  if (!profile.actif) {
    await supabase.auth.signOut()
    throw new Error('Compte désactivé. Contactez l\'administrateur.')
  }
  if (!isStaffRole(profile.role)) {
    await supabase.auth.signOut()
    throw new Error('Ce compte n\'a pas accès à l\'administration.')
  }
  return profile
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

function profileFromRow(d: {
  id: string; email: string; nom: string | null; role: Role | null; actif: boolean
  verifie_securite?: boolean; date_verification?: string | null
}): UserProfile {
  return {
    uid: d.id, email: d.email, nom: d.nom, role: d.role, actif: d.actif,
    verifieSecurite: d.verifie_securite ?? false, dateVerification: d.date_verification ?? null,
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
  if (error || !data) return null
  return profileFromRow(data)
}

export async function getStaffProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*').in('role', STAFF_ROLES).order('nom')
  if (error) throw error
  return (data ?? []).map(profileFromRow)
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(profileFromRow)
}

export async function updateUserRole(uid: string, role: Role | null): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', uid)
  if (error) throw error
}

export async function updateUserActif(uid: string, actif: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ actif }).eq('id', uid)
  if (error) throw error
}

export async function updateUserVerification(uid: string, verifie: boolean): Promise<void> {
  const { data: user } = await supabase.auth.getUser()
  const { error } = await supabase.from('profiles').update({
    verifie_securite: verifie,
    date_verification: verifie ? new Date().toISOString().slice(0, 10) : null,
    verifie_par: verifie ? (user.user?.id ?? null) : null,
  }).eq('id', uid)
  if (error) throw error
}

export function onAuthChange(cb: (user: User | null) => void): () => void {
  supabase.auth.getSession().then(({ data }) => cb(data.session?.user ?? null))
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null))
  return () => sub.subscription.unsubscribe()
}
