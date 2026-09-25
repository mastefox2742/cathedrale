import { supabase } from './supabase'
import { getPerimetreAdmin, ARCHIDIOCESE } from './scope'
import type { ParishRole } from './auth'

export interface StatsTableauDeBord {
  paroisses: number
  fideles: number
  catechistes: number
  enfants: number
  dons_total: number
  dons_en_attente: number
  intentions_recues: number
  temoignages_attente: number
  demandes_recues: number
  adhesions_nouvelles: number
  signalements_nouveaux: number | null
  videos: number
  vues_videos: number
  parcours_inscrits: number
  abonnes: number
}

/** Chiffres clés du périmètre admin courant (une paroisse ou tout l'archidiocèse). */
export async function getStatsTableauDeBord(): Promise<StatsTableauDeBord> {
  const scope = getPerimetreAdmin()
  const { data, error } = await supabase.rpc('stats_tableau_de_bord', {
    p_parish: scope && scope !== ARCHIDIOCESE ? scope : null,
  })
  if (error) throw error
  return data as StatsTableauDeBord
}

export interface StatsParoisse {
  parish_id: string
  nom: string
  fideles: number
  catechistes: number
  enfants: number
  dons_total: number
  demandes_recues: number
  parcours_termines: number
}

export async function getStatsParParoisse(): Promise<StatsParoisse[]> {
  const { data, error } = await supabase.rpc('stats_par_paroisse')
  if (error) throw error
  return ((data ?? []) as StatsParoisse[]).map(r => ({
    ...r,
    fideles: Number(r.fideles), catechistes: Number(r.catechistes), enfants: Number(r.enfants),
    dons_total: Number(r.dons_total), demandes_recues: Number(r.demandes_recues), parcours_termines: Number(r.parcours_termines),
  }))
}

export interface LigneRegistre {
  user_id: string
  nom: string | null
  email: string
  parish_nom: string
  role: ParishRole
  verifie_securite: boolean
  formations_requises: number
  formations_terminees: number
}

export async function getRegistreStaff(): Promise<LigneRegistre[]> {
  const scope = getPerimetreAdmin()
  const { data, error } = await supabase.rpc('registre_staff', {
    p_parish: scope && scope !== ARCHIDIOCESE ? scope : null,
  })
  if (error) throw error
  return (data ?? []) as LigneRegistre[]
}

/** Export CSV (séparateur « ; » pour Excel en français, BOM pour les accents). */
export function telechargerCsv(nomFichier: string, entetes: string[], lignes: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [entetes, ...lignes].map(l => l.map(esc).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}
