import { supabase } from './supabase'
import { getPerimetreAdmin, ARCHIDIOCESE, filtreAdmin } from './scope'
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
  heures_visionnage?: number
  presence_moyenne?: number | null
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

/* ── Séries pour les graphiques du tableau de bord ─────────────────────────── */

export interface PointMois {
  cle: string        // 2026-09
  mois: string       // « sept. 26 »
  inscriptions: number
  demarches: number
  intentions: number
  temoignages: number
  dons: number       // montant confirmé (XAF)
  [typeDon: string]: number | string
}

export interface SeriesTableauDeBord {
  mois: PointMois[]
  demarchesParType: Record<string, number>
  demarchesParStatut: Record<string, number>
  donsParType: Record<string, number>
  videos: { titre: string; vues: number }[]
}

function derniersMois(n: number): PointMois[] {
  const res: PointMois[] = []
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - (n - 1))
  for (let i = 0; i < n; i++) {
    res.push({
      cle: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      inscriptions: 0, demarches: 0, intentions: 0, temoignages: 0, dons: 0,
    })
    d.setMonth(d.getMonth() + 1)
  }
  return res
}

/** Activité des 12 derniers mois, agrégée côté navigateur (lecture limitée par la RLS). */
export async function getSeriesTableauDeBord(nbMois = 12): Promise<SeriesTableauDeBord> {
  const mois = derniersMois(nbMois)
  const depuis = `${mois[0].cle}-01`
  const parCle = new Map(mois.map(m => [m.cle, m]))
  const cle = (iso: string) => iso.slice(0, 7)
  const lire = async <T,>(q: PromiseLike<{ data: T[] | null; error: unknown }>) => {
    const { data, error } = await q
    return error ? [] : (data ?? [])
  }

  const [membres, demandes, intentions, temoignages, dons, videos] = await Promise.all([
    lire<{ created_at: string }>(filtreAdmin(supabase.from('parish_members').select('created_at').eq('role', 'membre').gte('created_at', depuis)).limit(10000)),
    lire<{ created_at: string; type: string; statut: string }>(filtreAdmin(supabase.from('demandes_pastorales').select('created_at, type, statut').gte('created_at', depuis)).limit(10000)),
    lire<{ created_at: string }>(filtreAdmin(supabase.from('prayer_intentions').select('created_at').gte('created_at', depuis)).limit(10000)),
    lire<{ created_at: string }>(filtreAdmin(supabase.from('temoignages').select('created_at').gte('created_at', depuis)).limit(10000)),
    lire<{ created_at: string; montant: number; type: string; statut: string }>(filtreAdmin(supabase.from('dons').select('created_at, montant, type, statut').gte('created_at', depuis)).limit(10000)),
    lire<{ titre: string; vues: number }>(filtreAdmin(supabase.from('evenements').select('titre, vues').gt('vues', 0)).order('vues', { ascending: false }).limit(8)),
  ])

  const compter = (rows: { created_at: string }[], champ: 'inscriptions' | 'demarches' | 'intentions' | 'temoignages') => {
    for (const r of rows) { const m = parCle.get(cle(r.created_at)); if (m) m[champ] += 1 }
  }
  compter(membres, 'inscriptions')
  compter(demandes, 'demarches')
  compter(intentions, 'intentions')
  compter(temoignages, 'temoignages')

  const demarchesParType: Record<string, number> = {}
  const demarchesParStatut: Record<string, number> = {}
  for (const d of demandes) {
    demarchesParType[d.type] = (demarchesParType[d.type] ?? 0) + 1
    demarchesParStatut[d.statut] = (demarchesParStatut[d.statut] ?? 0) + 1
  }

  const donsParType: Record<string, number> = {}
  for (const d of dons) {
    if (d.statut !== 'confirme') continue
    const montant = Number(d.montant) || 0
    const m = parCle.get(cle(d.created_at))
    if (m) {
      m.dons += montant
      m[d.type] = (Number(m[d.type]) || 0) + montant
    }
    donsParType[d.type] = (donsParType[d.type] ?? 0) + montant
  }

  return { mois, demarchesParType, demarchesParStatut, donsParType, videos: videos.map(v => ({ titre: v.titre, vues: Number(v.vues) })) }
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
