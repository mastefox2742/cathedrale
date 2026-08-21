import { supabase } from './supabase'
import { logAudit } from './auditLog'

// ── Types ────────────────────────────────────────────────────────────────────

export type NiveauType = 1 | 2 | 3 | 4  // 1=Éveil, 2=1ère Communion, 3=Confirmation, 4=RICA

export interface QuizQuestion {
  question: string
  reponses: string[]       // 4 choix
  bonneReponse: number     // index 0-3
  explication?: string
}

export interface Module {
  id?: string
  coursId: string
  ordre: number
  titre: string
  sousTitre?: string
  emoji: string
  publie: boolean
  createdAt?: string
}

export type TypeLecon = 'texte' | 'video' | 'audio' | 'document' | 'activite' | 'quiz'

export const TYPE_LECON_LABELS: Record<TypeLecon, string> = {
  texte: 'Texte', video: 'Vidéo', audio: 'Audio', document: 'Document', activite: 'Activité', quiz: 'Quiz',
}

export interface Lecon {
  id?: string
  moduleId: string
  ordre: number
  type: TypeLecon
  titre: string
  contenu?: string   // texte markdown (texte / activite)
  url?: string        // lien externe (video / audio / document)
  quiz: QuizQuestion[]  // rempli seulement si type === 'quiz'
  publie: boolean
  createdAt?: string
}

export interface Cours {
  id?: string
  niveau: NiveauType
  titre: string
  tranche: string          // "6 – 8 ans"
  description: string
  objectif: string
  emoji: string
  couleur: string          // accent color
  totalModules: number
  publie: boolean
  formationId?: string
  createdAt?: string
}

export interface FormationCatechisme {
  id?: string
  titre: string
  description: string
  emoji: string
  ordre: number
  publie: boolean
  createdAt?: string
  updatedAt?: string
}

const COURS_TABLE = 'cours'
const MODULES_TABLE = 'catechisme_modules'

interface CoursRow {
  id: string
  niveau: NiveauType
  titre: string
  tranche: string
  description: string
  objectif: string
  emoji: string
  couleur: string
  total_modules: number
  publie: boolean
  formation_id: string | null
  created_at: string
}

function coursFromRow(r: CoursRow): Cours {
  return {
    id: r.id, niveau: r.niveau, titre: r.titre, tranche: r.tranche,
    description: r.description, objectif: r.objectif, emoji: r.emoji, couleur: r.couleur,
    totalModules: r.total_modules, publie: r.publie, formationId: r.formation_id ?? undefined,
    createdAt: r.created_at,
  }
}

const FORMATIONS_TABLE = 'formations_catechisme'

interface FormationRow {
  id: string
  titre: string
  description: string
  emoji: string
  ordre: number
  publie: boolean
  created_at: string
  updated_at: string
}

function formationFromRow(r: FormationRow): FormationCatechisme {
  return {
    id: r.id, titre: r.titre, description: r.description, emoji: r.emoji,
    ordre: r.ordre, publie: r.publie, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getFormationsCatechisme(): Promise<FormationCatechisme[]> {
  const { data, error } = await supabase.from(FORMATIONS_TABLE).select('*').eq('publie', true).order('ordre')
  if (error) throw error
  return (data ?? []).map(formationFromRow)
}

export async function getAllFormationsCatechisme(): Promise<FormationCatechisme[]> {
  const { data, error } = await supabase.from(FORMATIONS_TABLE).select('*').order('ordre')
  if (error) throw error
  return (data ?? []).map(formationFromRow)
}

export async function addFormationCatechisme(data: Omit<FormationCatechisme, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(FORMATIONS_TABLE).insert({
    titre: data.titre, description: data.description, emoji: data.emoji, ordre: data.ordre, publie: data.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'formation_catechisme', row.id, data.titre)
  return row.id
}

export async function updateFormationCatechisme(id: string, data: Partial<FormationCatechisme>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.description !== undefined) patch.description = data.description
  if (data.emoji !== undefined) patch.emoji = data.emoji
  if (data.ordre !== undefined) patch.ordre = data.ordre
  if (data.publie !== undefined) patch.publie = data.publie
  const { error } = await supabase.from(FORMATIONS_TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'formation_catechisme', id, data.titre)
}

export async function deleteFormationCatechisme(id: string): Promise<void> {
  const { error } = await supabase.from(FORMATIONS_TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'formation_catechisme', id)
}

interface ModuleRow {
  id: string
  cours_id: string
  ordre: number
  titre: string
  sous_titre: string | null
  emoji: string
  publie: boolean
  created_at: string
}

function moduleFromRow(r: ModuleRow): Module {
  return {
    id: r.id, coursId: r.cours_id, ordre: r.ordre, titre: r.titre,
    sousTitre: r.sous_titre ?? undefined, emoji: r.emoji,
    publie: r.publie, createdAt: r.created_at,
  }
}

const LECONS_TABLE = 'lecons'

interface LeconRow {
  id: string
  module_id: string
  ordre: number
  type: TypeLecon
  titre: string
  contenu: string | null
  url: string | null
  quiz: QuizQuestion[]
  publie: boolean
  created_at: string
}

function leconFromRow(r: LeconRow): Lecon {
  return {
    id: r.id, moduleId: r.module_id, ordre: r.ordre, type: r.type, titre: r.titre,
    contenu: r.contenu ?? undefined, url: r.url ?? undefined, quiz: r.quiz ?? [],
    publie: r.publie, createdAt: r.created_at,
  }
}

export async function getLecons(moduleId: string): Promise<Lecon[]> {
  const { data, error } = await supabase.from(LECONS_TABLE).select('*')
    .eq('module_id', moduleId).eq('publie', true).order('ordre')
  if (error) throw error
  return (data ?? []).map(leconFromRow)
}

export async function getAllLecons(moduleId: string): Promise<Lecon[]> {
  const { data, error } = await supabase.from(LECONS_TABLE).select('*')
    .eq('module_id', moduleId).order('ordre')
  if (error) throw error
  return (data ?? []).map(leconFromRow)
}

export async function addLecon(data: Omit<Lecon, 'id' | 'createdAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(LECONS_TABLE).insert({
    module_id: data.moduleId, ordre: data.ordre, type: data.type, titre: data.titre,
    contenu: data.contenu || null, url: data.url || null, quiz: data.quiz, publie: data.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'lecon', row.id, data.titre)
  return row.id
}

export async function updateLecon(id: string, data: Partial<Lecon>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (data.ordre !== undefined) patch.ordre = data.ordre
  if (data.type !== undefined) patch.type = data.type
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.contenu !== undefined) patch.contenu = data.contenu || null
  if (data.url !== undefined) patch.url = data.url || null
  if (data.quiz !== undefined) patch.quiz = data.quiz
  if (data.publie !== undefined) patch.publie = data.publie

  const { error } = await supabase.from(LECONS_TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'lecon', id, data.titre)
}

export async function deleteLecon(id: string): Promise<void> {
  const { error } = await supabase.from(LECONS_TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'lecon', id)
}

// ── Cours ────────────────────────────────────────────────────────────────────

export async function getCours(): Promise<Cours[]> {
  const { data, error } = await supabase.from(COURS_TABLE).select('*').eq('publie', true).order('niveau')
  if (error) throw error
  return (data ?? []).map(coursFromRow)
}

export async function getAllCours(): Promise<Cours[]> {
  const { data, error } = await supabase.from(COURS_TABLE).select('*').order('niveau')
  if (error) throw error
  return (data ?? []).map(coursFromRow)
}

export async function getCoursById(id: string): Promise<Cours | null> {
  const { data, error } = await supabase.from(COURS_TABLE).select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return coursFromRow(data)
}

export async function addCours(data: Omit<Cours, 'id' | 'createdAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(COURS_TABLE).insert({
    niveau: data.niveau, titre: data.titre, tranche: data.tranche, description: data.description,
    objectif: data.objectif, emoji: data.emoji, couleur: data.couleur,
    total_modules: data.totalModules, publie: data.publie, formation_id: data.formationId || null,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'cours', row.id, data.titre)
  return row.id
}

export async function updateCours(id: string, data: Partial<Cours>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (data.niveau !== undefined) patch.niveau = data.niveau
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.tranche !== undefined) patch.tranche = data.tranche
  if (data.description !== undefined) patch.description = data.description
  if (data.objectif !== undefined) patch.objectif = data.objectif
  if (data.emoji !== undefined) patch.emoji = data.emoji
  if (data.couleur !== undefined) patch.couleur = data.couleur
  if (data.totalModules !== undefined) patch.total_modules = data.totalModules
  if (data.publie !== undefined) patch.publie = data.publie
  if (data.formationId !== undefined) patch.formation_id = data.formationId || null

  const { error } = await supabase.from(COURS_TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'cours', id, data.titre)
}

// ── Modules ──────────────────────────────────────────────────────────────────

export async function getModules(coursId: string): Promise<Module[]> {
  const { data, error } = await supabase.from(MODULES_TABLE).select('*')
    .eq('cours_id', coursId).eq('publie', true).order('ordre')
  if (error) throw error
  return (data ?? []).map(moduleFromRow)
}

export async function getAllModules(coursId: string): Promise<Module[]> {
  const { data, error } = await supabase.from(MODULES_TABLE).select('*')
    .eq('cours_id', coursId).order('ordre')
  if (error) throw error
  return (data ?? []).map(moduleFromRow)
}

export async function addModule(data: Omit<Module, 'id' | 'createdAt'>): Promise<string> {
  const { data: row, error } = await supabase.from(MODULES_TABLE).insert({
    cours_id: data.coursId, ordre: data.ordre, titre: data.titre, sous_titre: data.sousTitre || null,
    emoji: data.emoji, publie: data.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'module', row.id, data.titre)
  return row.id
}

export async function updateModule(id: string, data: Partial<Module>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (data.coursId !== undefined) patch.cours_id = data.coursId
  if (data.ordre !== undefined) patch.ordre = data.ordre
  if (data.titre !== undefined) patch.titre = data.titre
  if (data.sousTitre !== undefined) patch.sous_titre = data.sousTitre || null
  if (data.emoji !== undefined) patch.emoji = data.emoji
  if (data.publie !== undefined) patch.publie = data.publie

  const { error } = await supabase.from(MODULES_TABLE).update(patch).eq('id', id)
  if (error) throw error
  await logAudit('update', 'module', id, data.titre)
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase.from(MODULES_TABLE).delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'module', id)
}

