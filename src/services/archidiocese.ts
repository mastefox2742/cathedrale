import { supabase } from './supabase'
import { logAudit } from './auditLog'

/** Archidiocèse (histoire, présentation), chartes et alertes aux responsables. */

export interface Archidiocese {
  id: string
  nom: string
  slug: string
  presentation: string | null
  histoire: string | null
  histoireMaj: string | null
}

export async function getArchidiocese(slug = 'brazzaville'): Promise<Archidiocese | null> {
  const { data, error } = await supabase.from('archdioceses').select('id, nom, slug, presentation, histoire, histoire_maj').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? { id: data.id, nom: data.nom, slug: data.slug, presentation: data.presentation, histoire: data.histoire, histoireMaj: data.histoire_maj } : null
}

/** Archidiocèse de la personne connectée (profil), sinon Brazzaville. */
export async function getMonArchidiocese(): Promise<Archidiocese | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (auth.user) {
    const { data } = await supabase.from('profiles').select('archdiocese_id').eq('id', auth.user.id).maybeSingle()
    if (data?.archdiocese_id) {
      const { data: a } = await supabase.from('archdioceses').select('slug').eq('id', data.archdiocese_id).maybeSingle()
      if (a) return getArchidiocese(a.slug)
    }
  }
  return getArchidiocese()
}

export async function majArchidiocese(id: string, d: { presentation: string; histoire: string }): Promise<void> {
  const { error } = await supabase.from('archdioceses').update({
    presentation: d.presentation, histoire: d.histoire, histoire_maj: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw error
  await logAudit('update', 'archidiocese', id, 'histoire et présentation')
}

// ── Chartes ─────────────────────────────────────────────────────────────────

export type SlugCharte = 'media' | 'protection-mineurs'

export interface Charte {
  id: string
  archdioceseId: string
  slug: SlugCharte
  titre: string
  contenu: string
  version: number
  publie: boolean
  updatedAt: string
}

interface CharteRow {
  id: string; archdiocese_id: string; slug: SlugCharte; titre: string; contenu: string
  version: number; publie: boolean; updated_at: string
}

function charteFromRow(r: CharteRow): Charte {
  return { id: r.id, archdioceseId: r.archdiocese_id, slug: r.slug, titre: r.titre, contenu: r.contenu, version: r.version, publie: r.publie, updatedAt: r.updated_at }
}

export async function getCharte(slug: SlugCharte, archdioceseId?: string): Promise<Charte | null> {
  let q = supabase.from('chartes').select('*').eq('slug', slug)
  if (archdioceseId) q = q.eq('archdiocese_id', archdioceseId)
  const { data, error } = await q.limit(1).maybeSingle()
  if (error) throw error
  return data ? charteFromRow(data) : null
}

export async function getChartes(archdioceseId: string): Promise<Charte[]> {
  const { data, error } = await supabase.from('chartes').select('*').eq('archdiocese_id', archdioceseId).order('slug')
  if (error) throw error
  return (data ?? []).map(charteFromRow)
}

/** Enregistre une nouvelle version (le numéro de version augmente si le texte change). */
export async function majCharte(c: Charte, d: { titre: string; contenu: string; publie: boolean }): Promise<void> {
  const { error } = await supabase.from('chartes').update({
    titre: d.titre, contenu: d.contenu, publie: d.publie,
    version: d.contenu !== c.contenu ? c.version + 1 : c.version,
    updated_at: new Date().toISOString(),
  }).eq('id', c.id)
  if (error) throw error
  await logAudit('update', 'charte', c.id, `${d.titre}${d.publie ? ' (publiée)' : ''}`)
}

// ── Alertes aux responsables ────────────────────────────────────────────────

export type TypeAlerte = 'demarche' | 'intention' | 'temoignage' | 'adhesion' | 'signalement' | 'don'

export interface Alerte {
  id: string
  type: TypeAlerte
  titre: string
  lien: string
  createdAt: string
  lue: boolean
}

export const ICONE_ALERTE: Record<TypeAlerte, string> = {
  demarche: 'assignment', intention: 'volunteer_activism', temoignage: 'rate_review',
  adhesion: 'group_add', signalement: 'shield', don: 'payments',
}

/** Alertes visibles selon les droits (RLS) : paroisse du périmètre ou tout l'archidiocèse. */
export async function getAlertes(userId: string, parishId: string | null, max = 40): Promise<Alerte[]> {
  let q = supabase.from('alertes').select('id, type, titre, lien, created_at').order('created_at', { ascending: false }).limit(max)
  if (parishId) q = q.eq('parish_id', parishId)
  const [{ data, error }, { data: lues }] = await Promise.all([
    q,
    supabase.from('alertes_lues').select('alerte_id').eq('user_id', userId),
  ])
  if (error) throw error
  const setLues = new Set((lues ?? []).map(l => l.alerte_id))
  return (data ?? []).map(a => ({ id: a.id, type: a.type, titre: a.titre, lien: a.lien, createdAt: a.created_at, lue: setLues.has(a.id) }))
}

export async function marquerAlertesLues(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('alertes_lues').upsert(ids.map(id => ({ user_id: userId, alerte_id: id })), { onConflict: 'user_id,alerte_id', ignoreDuplicates: true })
  if (error) throw error
}

// ── Données personnelles ────────────────────────────────────────────────────

export async function exporterMesDonnees(): Promise<unknown> {
  const { data, error } = await supabase.rpc('exporter_mes_donnees')
  if (error) throw error
  return data
}

export async function supprimerMonCompte(): Promise<void> {
  const { error } = await supabase.rpc('supprimer_mon_compte')
  if (error) throw error
  await supabase.auth.signOut()
}
