import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { getPerimetreAdmin, ARCHIDIOCESE } from './scope'

/** Rôles archidiocésains (profiles.role) — valables dans toutes les paroisses. */
export type GlobalRole =
  | 'admin' | 'archeveque' | 'admin_diocesain' | 'admin_evangelisation'
  | 'coordinateur_catechese_diocesain' | 'responsable_media_diocesain' | 'responsable_securite'

/** Rôles paroissiaux (parish_members.role) — valables dans une paroisse donnée. */
export type ParishRole =
  | 'admin_paroisse' | 'pretre' | 'secretariat' | 'tresorier' | 'coordinateur_catechese' | 'catechiste'
  | 'staff_media' | 'redacteur' | 'responsable_groupe' | 'animateur_jeunesse' | 'responsable_liturgie'
  | 'responsable_securite' | 'parent' | 'benevole' | 'membre'

export type Role = GlobalRole | ParishRole

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur de la plateforme',
  archeveque: 'Archevêque',
  admin_diocesain: 'Administrateur diocésain',
  admin_evangelisation: 'Responsable évangélisation',
  coordinateur_catechese_diocesain: 'Coordinateur diocésain de la catéchèse',
  responsable_media_diocesain: 'Responsable média diocésain',
  responsable_securite: 'Responsable protection des mineurs',
  admin_paroisse: 'Administrateur de paroisse',
  pretre: 'Prêtre',
  secretariat: 'Secrétariat',
  tresorier: 'Trésorier',
  coordinateur_catechese: 'Coordinateur catéchèse',
  catechiste: 'Catéchiste',
  staff_media: 'Équipe média',
  redacteur: 'Rédacteur',
  responsable_groupe: 'Responsable de groupe',
  animateur_jeunesse: 'Animateur Jeunesse',
  responsable_liturgie: 'Responsable liturgie',
  parent: 'Parent',
  benevole: 'Bénévole',
  membre: 'Membre',
}

export const GLOBAL_ROLES: GlobalRole[] = [
  'admin', 'archeveque', 'admin_diocesain', 'admin_evangelisation',
  'coordinateur_catechese_diocesain', 'responsable_media_diocesain', 'responsable_securite',
]

export const PARISH_STAFF_ROLES: ParishRole[] = [
  'admin_paroisse', 'pretre', 'secretariat', 'tresorier', 'coordinateur_catechese', 'catechiste',
  'staff_media', 'redacteur', 'responsable_groupe', 'animateur_jeunesse', 'responsable_liturgie',
  'responsable_securite',
]

export const PARISH_ROLES: ParishRole[] = [...PARISH_STAFF_ROLES, 'parent', 'benevole', 'membre']

/** Rôles opérationnels — donnent accès au panneau d'administration. */
export const STAFF_ROLES: Role[] = [...GLOBAL_ROLES, ...PARISH_STAFF_ROLES]

const DIOCESAN_ADMIN_ROLES: Role[] = ['admin', 'archeveque', 'admin_diocesain']

/** Rôles globaux pouvant travailler au niveau « tout l'archidiocèse ». */
const DIOCESAN_CONTENT_ROLES: Role[] = [...DIOCESAN_ADMIN_ROLES, 'admin_evangelisation', 'responsable_media_diocesain', 'coordinateur_catechese_diocesain', 'responsable_securite']

export function isStaffRole(role: Role | null): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

function hasAny(roles: Role[], allowed: Role[]): boolean {
  return roles.some(r => allowed.includes(r))
}

export function isDiocesanAdmin(roles: Role[]): boolean {
  return hasAny(roles, DIOCESAN_ADMIN_ROLES)
}

export function canWorkDiocesan(roles: Role[]): boolean {
  return hasAny(roles, DIOCESAN_CONTENT_ROLES)
}

/** Rôles ayant un besoin opérationnel réel de voir des dossiers enfants (protection des mineurs). */
export function canManageEnfants(roles: Role[]): boolean {
  return hasAny(roles, [...DIOCESAN_ADMIN_ROLES, 'responsable_securite', 'admin_paroisse', 'catechiste', 'coordinateur_catechese', 'secretariat'])
}

/** Signalements : plus restreint — jamais catéchiste/secrétariat, un signalement peut les concerner. */
export function canViewSignalements(roles: Role[]): boolean {
  return hasAny(roles, [...DIOCESAN_ADMIN_ROLES, 'responsable_securite'])
}

export function canManageDons(roles: Role[]): boolean {
  return hasAny(roles, [...DIOCESAN_ADMIN_ROLES, 'admin_paroisse', 'tresorier'])
}

export function canManageMembres(roles: Role[]): boolean {
  return hasAny(roles, [...DIOCESAN_ADMIN_ROLES, 'admin_paroisse'])
}

export function canViewAudit(roles: Role[]): boolean {
  return hasAny(roles, [...DIOCESAN_ADMIN_ROLES, 'responsable_securite', 'admin_paroisse'])
}

/** Histoire de l'archidiocèse et chartes (média : responsable média ; mineurs : responsable sécurité). */
export function canEditStandards(roles: Role[]): boolean {
  return hasAny(roles, [...DIOCESAN_ADMIN_ROLES, 'responsable_media_diocesain', 'responsable_securite'])
}

export function canViewRegistre(roles: Role[]): boolean {
  return hasAny(roles, [...DIOCESAN_ADMIN_ROLES, 'responsable_securite', 'coordinateur_catechese_diocesain', 'admin_paroisse', 'coordinateur_catechese'])
}

export interface UserProfile {
  uid: string
  email: string
  nom: string | null
  role: GlobalRole | null
  telephone?: string | null
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
  const { data: memberships } = await supabase.from('parish_members').select('role').eq('user_id', data.user.id)
  const staff = isStaffRole(profile.role) || (memberships ?? []).some(m => PARISH_STAFF_ROLES.includes(m.role as ParishRole))
  if (!staff) {
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
  id: string; email: string; nom: string | null; role: GlobalRole | null; actif: boolean
  telephone?: string | null; verifie_securite?: boolean; date_verification?: string | null
}): UserProfile {
  return {
    uid: d.id, email: d.email, nom: d.nom, role: d.role, actif: d.actif, telephone: d.telephone ?? null,
    verifieSecurite: d.verifie_securite ?? false, dateVerification: d.date_verification ?? null,
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
  if (error || !data) return null
  return profileFromRow(data)
}

/** Personnes du staff dans le périmètre admin courant (pour « assigner à »). */
export async function getStaffProfiles(): Promise<UserProfile[]> {
  const scope = getPerimetreAdmin()
  let query = supabase.from('parish_members').select('user_id').in('role', PARISH_STAFF_ROLES)
  if (scope && scope !== ARCHIDIOCESE) query = query.eq('parish_id', scope)
  const [{ data: membres, error: mErr }, { data: globaux, error: gErr }] = await Promise.all([
    query,
    supabase.from('profiles').select('id').in('role', GLOBAL_ROLES),
  ])
  if (mErr) throw mErr
  if (gErr) throw gErr
  const ids = [...new Set([...(membres ?? []).map(m => m.user_id), ...(globaux ?? []).map(g => g.id)])]
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('profiles').select('*').in('id', ids).eq('actif', true).order('nom')
  if (error) throw error
  return (data ?? []).map(profileFromRow)
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(profileFromRow)
}

export async function updateUserRole(uid: string, role: GlobalRole | null): Promise<void> {
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

export async function majMonProfil(nom: string, telephone: string): Promise<void> {
  const { error } = await supabase.rpc('maj_mon_profil', { p_nom: nom, p_telephone: telephone })
  if (error) throw error
}
