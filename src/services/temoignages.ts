import { supabase } from './supabase'
import { logAudit } from './auditLog'

export type StatutTemoignage = 'en_attente' | 'approuve' | 'rejete'

export const STATUT_TEMOIGNAGE_LABELS: Record<StatutTemoignage, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  rejete: 'Rejeté',
}

export interface Temoignage {
  id?: string
  auteurNom?: string
  contenu: string
  statut: StatutTemoignage
  createdAt?: string
  updatedAt?: string
}

interface TemoignageRow {
  id: string
  auteur_nom: string | null
  contenu: string
  statut: StatutTemoignage
  created_at: string
  updated_at: string
}

function fromRow(r: TemoignageRow): Temoignage {
  return {
    id: r.id, auteurNom: r.auteur_nom ?? undefined, contenu: r.contenu,
    statut: r.statut, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export async function getTemoignagesApprouves(): Promise<Temoignage[]> {
  const { data, error } = await supabase.from('temoignages').select('*')
    .eq('statut', 'approuve').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getAllTemoignages(): Promise<Temoignage[]> {
  const { data, error } = await supabase.from('temoignages').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function deposerTemoignage(contenu: string, auteurNom?: string): Promise<void> {
  const { error } = await supabase.from('temoignages').insert({
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
