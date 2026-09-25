import { supabase } from './supabase'
import { filtrePublic, filtreAdmin, parishPublique } from './scope'
import { logAudit } from './auditLog'

export type StatutTemoignage = 'en_attente' | 'approuve' | 'rejete'

export const STATUT_TEMOIGNAGE_LABELS: Record<StatutTemoignage, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  rejete: 'Rejeté',
}

export interface CategorieTemoignage {
  id: string
  slug: string
  libelle: string
  emoji: string
}

export interface Temoignage {
  id?: string
  auteurNom?: string
  contenu: string
  statut: StatutTemoignage
  categorieId?: string
  misEnAvant?: boolean
  createdAt?: string
  updatedAt?: string
}

interface TemoignageRow {
  id: string
  auteur_nom: string | null
  contenu: string
  statut: StatutTemoignage
  category_id?: string | null
  mis_en_avant?: boolean
  created_at: string
  updated_at: string
}

function fromRow(r: TemoignageRow): Temoignage {
  return {
    id: r.id, auteurNom: r.auteur_nom ?? undefined, contenu: r.contenu,
    statut: r.statut, categorieId: r.category_id ?? undefined, misEnAvant: r.mis_en_avant ?? false,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getTemoignagesApprouves(): Promise<Temoignage[]> {
  const { data, error } = await filtrePublic(supabase.from('temoignages').select('*')
    .eq('statut', 'approuve')).order('mis_en_avant', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getAllTemoignages(): Promise<Temoignage[]> {
  const { data, error } = await filtreAdmin(supabase.from('temoignages').select('*')).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function deposerTemoignage(contenu: string, auteurNom?: string, categorieId?: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase.from('temoignages').insert({
    ...parishPublique(), user_id: auth.user?.id ?? null, category_id: categorieId || null,
    contenu, auteur_nom: auteurNom || null, statut: 'en_attente',
  })
  if (error) throw error
}

export async function updateStatutTemoignage(id: string, statut: StatutTemoignage): Promise<void> {
  const { error } = await supabase.from('temoignages').update({ statut, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  await logAudit('update', 'temoignage', id, statut)
}

export async function deleteTemoignage(id: string): Promise<void> {
  const { error } = await supabase.from('temoignages').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'temoignage', id)
}

export async function getCategoriesTemoignage(): Promise<CategorieTemoignage[]> {
  const { data, error } = await supabase.from('testimony_categories').select('id, slug, libelle, emoji').order('ordre')
  if (error) throw error
  return data ?? []
}

export async function setMiseEnAvant(id: string, misEnAvant: boolean): Promise<void> {
  const { error } = await supabase.from('temoignages').update({ mis_en_avant: misEnAvant, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  await logAudit('update', 'temoignage', id, misEnAvant ? 'mis en avant' : 'retiré de la une')
}

export async function setCategorieTemoignage(id: string, categorieId: string | null): Promise<void> {
  const { error } = await supabase.from('temoignages').update({ category_id: categorieId, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function getMesTemoignages(userId: string): Promise<Temoignage[]> {
  const { data, error } = await supabase.from('temoignages').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}
