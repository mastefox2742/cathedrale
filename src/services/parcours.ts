import { supabase } from './supabase'
import { filtrePublic, filtreAdmin, parishIdPourCreation } from './scope'
import { logAudit } from './auditLog'
import type { QuizQuestion } from './catechisme'
import type { ParishRole } from './auth'

export type TypeParcours = 'decouvrir' | 'conversion' | 'approfondir' | 'neuvaine' | 'retraite' | 'formation_staff'

export const TYPE_PARCOURS: Record<TypeParcours, { label: string; route: string; titre: string; accroche: string }> = {
  decouvrir: { label: 'Découvrir la foi', route: '/decouvrir-la-foi', titre: 'Je découvre la foi', accroche: 'Pour les curieux, ceux qui cherchent, ceux qui doutent.' },
  conversion: { label: 'Conversion & catéchuménat', route: '/se-convertir', titre: 'Je veux me convertir', accroche: 'Devenir chrétien : les étapes, des témoignages, un accompagnement.' },
  approfondir: { label: 'Approfondir', route: '/approfondir', titre: 'Je veux approfondir ma foi', accroche: 'Bible, doctrine, vie spirituelle, engagement.' },
  neuvaine: { label: 'Neuvaine', route: '/prier', titre: 'Neuvaines', accroche: 'Neuf jours de prière confiante.' },
  retraite: { label: 'Retraite en ligne', route: '/prier', titre: 'Retraites en ligne', accroche: 'Quelques jours pour se poser avec Dieu.' },
  formation_staff: { label: 'Formation du staff', route: '/connexion', titre: 'Formations obligatoires', accroche: 'Pour les catéchistes et encadrants.' },
}

export type AppelAction = 'aucun' | 'parler_pretre' | 'commencer_parcours' | 'demarche' | 'prier'

export const APPEL_ACTION: Record<AppelAction, { label: string; to: string | null }> = {
  aucun: { label: 'Aucun', to: null },
  parler_pretre: { label: 'Parler à un prêtre', to: '/demarches?type=accompagnement' },
  commencer_parcours: { label: 'Commencer un autre parcours', to: '/approfondir' },
  demarche: { label: 'Faire une demande (baptême…)', to: '/demarches?type=bapteme' },
  prier: { label: 'Déposer une intention de prière', to: '/prier' },
}

export interface Parcours {
  id: string
  parishId: string | null
  type: TypeParcours
  titre: string
  slug: string
  description: string
  emoji: string
  imageUrl: string | null
  duree: string | null
  obligatoirePour: ParishRole[]
  ordre: number
  publie: boolean
}

export type ParcoursInput = Omit<Parcours, 'id' | 'parishId'>

export interface Etape {
  id: string
  pathId: string
  ordre: number
  titre: string
  contenu: string
  videoUrl: string | null
  quiz: QuizQuestion[]
  appelAction: AppelAction
}

export type EtapeInput = Omit<Etape, 'id'>

interface ParcoursRow {
  id: string; parish_id: string | null; type: TypeParcours; titre: string; slug: string
  description: string; emoji: string; image_url: string | null; duree: string | null
  obligatoire_pour: ParishRole[] | null; ordre: number; publie: boolean
}

interface EtapeRow {
  id: string; path_id: string; ordre: number; titre: string; contenu: string
  video_url: string | null; quiz: QuizQuestion[] | null; appel_action: AppelAction
}

function fromRow(r: ParcoursRow): Parcours {
  return {
    id: r.id, parishId: r.parish_id, type: r.type, titre: r.titre, slug: r.slug,
    description: r.description, emoji: r.emoji, imageUrl: r.image_url, duree: r.duree,
    obligatoirePour: r.obligatoire_pour ?? [], ordre: r.ordre, publie: r.publie,
  }
}

function etapeFromRow(r: EtapeRow): Etape {
  return {
    id: r.id, pathId: r.path_id, ordre: r.ordre, titre: r.titre, contenu: r.contenu,
    videoUrl: r.video_url, quiz: r.quiz ?? [], appelAction: r.appel_action,
  }
}

export async function getParcoursPublies(types?: TypeParcours[]): Promise<Parcours[]> {
  let query = filtrePublic(supabase.from('evangelization_paths').select('*').eq('publie', true))
  if (types) query = query.in('type', types)
  const { data, error } = await query.order('ordre')
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getParcoursBySlug(slug: string): Promise<Parcours | null> {
  const { data, error } = await supabase.from('evangelization_paths').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function getEtapes(pathId: string): Promise<Etape[]> {
  const { data, error } = await supabase.from('path_steps').select('*').eq('path_id', pathId).order('ordre')
  if (error) throw error
  return (data ?? []).map(etapeFromRow)
}

// ── Progression ─────────────────────────────────────────────────────────────

export async function getEtapesTerminees(userId: string, pathId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('user_path_progress').select('step_id, termine_le')
    .eq('user_id', userId).eq('path_id', pathId)
  if (error) throw error
  return new Map((data ?? []).map(r => [r.step_id, r.termine_le]))
}

export interface ProgressionParcours {
  parcours: Parcours
  faites: number
  total: number
  termineLe: string | null
}

/** Tous les parcours commencés par l'utilisateur, avec leur avancement. */
export async function getMesParcours(userId: string): Promise<ProgressionParcours[]> {
  const { data, error } = await supabase.from('user_path_progress').select('path_id, termine_le').eq('user_id', userId)
  if (error) throw error
  const parPath = new Map<string, { n: number; dernier: string }>()
  for (const r of data ?? []) {
    const cur = parPath.get(r.path_id)
    parPath.set(r.path_id, { n: (cur?.n ?? 0) + 1, dernier: !cur || r.termine_le > cur.dernier ? r.termine_le : cur.dernier })
  }
  const ids = [...parPath.keys()]
  if (ids.length === 0) return []
  const [{ data: paths, error: pErr }, { data: steps, error: sErr }] = await Promise.all([
    supabase.from('evangelization_paths').select('*').in('id', ids),
    supabase.from('path_steps').select('path_id').in('path_id', ids),
  ])
  if (pErr) throw pErr
  if (sErr) throw sErr
  const totaux = new Map<string, number>()
  for (const s of steps ?? []) totaux.set(s.path_id, (totaux.get(s.path_id) ?? 0) + 1)
  return (paths ?? []).map(p => {
    const prog = parPath.get(p.id)!
    const total = totaux.get(p.id) ?? 0
    return { parcours: fromRow(p), faites: prog.n, total, termineLe: total > 0 && prog.n >= total ? prog.dernier : null }
  })
}

export async function terminerEtape(userId: string, etape: Etape, score?: number): Promise<void> {
  const { error } = await supabase.from('user_path_progress').upsert(
    { user_id: userId, step_id: etape.id, path_id: etape.pathId, score: score ?? null },
    { onConflict: 'user_id,step_id', ignoreDuplicates: true },
  )
  if (error) throw error
}

// ── Administration ──────────────────────────────────────────────────────────

export async function getAllParcours(): Promise<Parcours[]> {
  const { data, error } = await filtreAdmin(supabase.from('evangelization_paths').select('*')).order('type').order('ordre')
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getStatsParcours(): Promise<Map<string, { inscrits: number; termines: number }>> {
  const { data, error } = await supabase.rpc('stats_parcours')
  if (error) throw error
  return new Map(((data ?? []) as { path_id: string; inscrits: number; termines: number }[])
    .map(r => [r.path_id, { inscrits: Number(r.inscrits), termines: Number(r.termines) }]))
}

function parcoursToRow(d: Partial<ParcoursInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (d.type !== undefined) row.type = d.type
  if (d.titre !== undefined) row.titre = d.titre
  if (d.slug !== undefined) row.slug = d.slug
  if (d.description !== undefined) row.description = d.description
  if (d.emoji !== undefined) row.emoji = d.emoji || '✝️'
  if (d.imageUrl !== undefined) row.image_url = d.imageUrl || null
  if (d.duree !== undefined) row.duree = d.duree || null
  if (d.obligatoirePour !== undefined) row.obligatoire_pour = d.obligatoirePour
  if (d.ordre !== undefined) row.ordre = d.ordre
  if (d.publie !== undefined) row.publie = d.publie
  return row
}

export async function createParcours(d: ParcoursInput): Promise<string> {
  const { data, error } = await supabase.from('evangelization_paths')
    .insert({ ...parcoursToRow(d), parish_id: parishIdPourCreation() }).select('id').single()
  if (error) throw error
  await logAudit('create', 'parcours', data.id, d.titre)
  return data.id
}

export async function updateParcours(id: string, d: Partial<ParcoursInput>): Promise<void> {
  const { error } = await supabase.from('evangelization_paths')
    .update({ ...parcoursToRow(d), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  await logAudit('update', 'parcours', id, d.titre)
}

export async function deleteParcours(id: string): Promise<void> {
  const { error } = await supabase.from('evangelization_paths').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'parcours', id)
}

function etapeToRow(d: Partial<EtapeInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (d.pathId !== undefined) row.path_id = d.pathId
  if (d.ordre !== undefined) row.ordre = d.ordre
  if (d.titre !== undefined) row.titre = d.titre
  if (d.contenu !== undefined) row.contenu = d.contenu
  if (d.videoUrl !== undefined) row.video_url = d.videoUrl || null
  if (d.quiz !== undefined) row.quiz = d.quiz
  if (d.appelAction !== undefined) row.appel_action = d.appelAction
  return row
}

export async function createEtape(d: EtapeInput): Promise<string> {
  const { data, error } = await supabase.from('path_steps').insert(etapeToRow(d)).select('id').single()
  if (error) throw error
  await logAudit('create', 'etape_parcours', data.id, d.titre)
  return data.id
}

export async function updateEtape(id: string, d: Partial<EtapeInput>): Promise<void> {
  const { error } = await supabase.from('path_steps').update({ ...etapeToRow(d), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  await logAudit('update', 'etape_parcours', id, d.titre)
}

export async function deleteEtape(id: string): Promise<void> {
  const { error } = await supabase.from('path_steps').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'etape_parcours', id)
}

/** Convertit une URL YouTube en URL d'intégration (null si non reconnue). */
export function youtubeEmbed(url: string | null): string | null {
  if (!url) return null
  const m = /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/.exec(url)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}
