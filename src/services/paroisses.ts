import { supabase } from './supabase'
import { logAudit } from './auditLog'
import type { ParishRole } from './auth'

export interface HoraireMesse {
  jour: string
  horaires: string[]
}

export interface HorairesParoisse {
  messes?: HoraireMesse[]
  confessions?: string
  permanence?: string
}

export interface Paroisse {
  id: string
  nom: string
  slug: string
  description: string | null
  cure: string | null
  adresse: string | null
  quartier: string | null
  ville: string
  latitude: number | null
  longitude: number | null
  telephone: string | null
  email: string | null
  whatsapp: string | null
  horaires: HorairesParoisse
  photoUrl: string | null
  actif: boolean
}

export type ParoisseInput = Omit<Paroisse, 'id'>

interface ParoisseRow {
  id: string
  nom: string
  slug: string
  description: string | null
  cure: string | null
  adresse: string | null
  quartier: string | null
  ville: string
  latitude: number | null
  longitude: number | null
  telephone: string | null
  email: string | null
  whatsapp: string | null
  horaires: HorairesParoisse | null
  photo_url: string | null
  actif: boolean
}

function fromRow(r: ParoisseRow): Paroisse {
  return {
    id: r.id, nom: r.nom, slug: r.slug, description: r.description, cure: r.cure,
    adresse: r.adresse, quartier: r.quartier, ville: r.ville, latitude: r.latitude,
    longitude: r.longitude, telephone: r.telephone, email: r.email, whatsapp: r.whatsapp,
    horaires: r.horaires ?? {}, photoUrl: r.photo_url, actif: r.actif,
  }
}

function toRow(d: Partial<ParoisseInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (d.nom !== undefined) row.nom = d.nom
  if (d.slug !== undefined) row.slug = d.slug
  if (d.description !== undefined) row.description = d.description || null
  if (d.cure !== undefined) row.cure = d.cure || null
  if (d.adresse !== undefined) row.adresse = d.adresse || null
  if (d.quartier !== undefined) row.quartier = d.quartier || null
  if (d.ville !== undefined) row.ville = d.ville || 'Brazzaville'
  if (d.latitude !== undefined) row.latitude = d.latitude
  if (d.longitude !== undefined) row.longitude = d.longitude
  if (d.telephone !== undefined) row.telephone = d.telephone || null
  if (d.email !== undefined) row.email = d.email || null
  if (d.whatsapp !== undefined) row.whatsapp = d.whatsapp || null
  if (d.horaires !== undefined) row.horaires = d.horaires
  if (d.photoUrl !== undefined) row.photo_url = d.photoUrl || null
  if (d.actif !== undefined) row.actif = d.actif
  return row
}

export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

let cache: Promise<Paroisse[]> | null = null

/** Paroisses actives (mises en cache pour la session). */
export function getParoisses(): Promise<Paroisse[]> {
  if (!cache) {
    cache = (async () => {
      const { data, error } = await supabase.from('parishes').select('*').eq('actif', true).order('nom')
      if (error) throw error
      return (data ?? []).map(fromRow)
    })()
    cache.catch(() => { cache = null })
  }
  return cache
}

export async function getToutesParoisses(): Promise<Paroisse[]> {
  const { data, error } = await supabase.from('parishes').select('*').order('nom')
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getParoisseBySlug(slug: string): Promise<Paroisse | null> {
  const { data, error } = await supabase.from('parishes').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function getParoisseById(id: string): Promise<Paroisse | null> {
  const { data, error } = await supabase.from('parishes').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function createParoisse(d: ParoisseInput): Promise<string> {
  const { data: arch, error: archErr } = await supabase.from('archdioceses').select('id').eq('slug', 'brazzaville').single()
  if (archErr) throw archErr
  const { data: row, error } = await supabase.from('parishes').insert({ ...toRow(d), archdiocese_id: arch.id }).select('id').single()
  if (error) throw error
  cache = null
  await logAudit('create', 'paroisse', row.id, d.nom)
  return row.id
}

export async function updateParoisse(id: string, d: Partial<ParoisseInput>): Promise<void> {
  const { error } = await supabase.from('parishes').update({ ...toRow(d), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  cache = null
  await logAudit('update', 'paroisse', id, d.nom)
}

/** Paroisse la plus proche d'une position (distance à vol d'oiseau). */
export function paroisseLaPlusProche(paroisses: Paroisse[], lat: number, lon: number): { paroisse: Paroisse; km: number } | null {
  let best: { paroisse: Paroisse; km: number } | null = null
  for (const p of paroisses) {
    if (p.latitude == null || p.longitude == null) continue
    const dLat = (p.latitude - lat) * Math.PI / 180
    const dLon = (p.longitude - lon) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(p.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    if (!best || km < best.km) best = { paroisse: p, km }
  }
  return best
}

// ── Membres et rôles paroissiaux ─────────────────────────────────────────────

export interface Appartenance {
  userId: string
  parishId: string
  role: ParishRole
  principale: boolean
}

export interface MembreParoisse extends Appartenance {
  nom: string | null
  email: string
}

function appartenanceFromRow(r: { user_id: string; parish_id: string; role: ParishRole; principale: boolean }): Appartenance {
  return { userId: r.user_id, parishId: r.parish_id, role: r.role, principale: r.principale }
}

export async function getMesAppartenances(userId: string): Promise<Appartenance[]> {
  const { data, error } = await supabase.from('parish_members').select('user_id, parish_id, role, principale').eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map(appartenanceFromRow)
}

export async function getMembresStaff(parishId: string): Promise<MembreParoisse[]> {
  const { data, error } = await supabase.from('parish_members')
    .select('user_id, parish_id, role, principale, profiles(nom, email)')
    .eq('parish_id', parishId).neq('role', 'membre')
  if (error) throw error
  return (data ?? []).map((r) => {
    const p = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as { nom: string | null; email: string } | null
    return { ...appartenanceFromRow(r as never), nom: p?.nom ?? null, email: p?.email ?? '' }
  })
}

/** Nomme un utilisateur existant (repéré par son email) à un rôle dans une paroisse. */
export async function nommerMembre(parishId: string, email: string, role: ParishRole): Promise<void> {
  const { data: prof, error: pErr } = await supabase.from('profiles').select('id').ilike('email', email.trim()).maybeSingle()
  if (pErr) throw pErr
  if (!prof) throw new Error("Aucun compte avec cet email. La personne doit d'abord créer son compte (Espace Membre).")
  const { error } = await supabase.from('parish_members').insert({ user_id: prof.id, parish_id: parishId, role })
  if (error && error.code !== '23505') throw error
  await logAudit('create', 'membre_paroisse', prof.id, `${role} — ${email}`)
}

export async function retirerMembre(parishId: string, userId: string, role: ParishRole): Promise<void> {
  const { error } = await supabase.from('parish_members').delete()
    .eq('parish_id', parishId).eq('user_id', userId).eq('role', role)
  if (error) throw error
  await logAudit('delete', 'membre_paroisse', userId, role)
}

export async function rejoindreParoisse(parishId: string): Promise<void> {
  const { error } = await supabase.rpc('rejoindre_paroisse', { p_parish: parishId })
  if (error) throw error
}

export async function quitterParoisse(parishId: string): Promise<void> {
  const { error } = await supabase.rpc('quitter_paroisse', { p_parish: parishId })
  if (error) throw error
}

export async function definirParoissePrincipale(parishId: string): Promise<void> {
  const { error } = await supabase.rpc('definir_paroisse_principale', { p_parish: parishId })
  if (error) throw error
}
