import { supabase } from './supabase'
import { logAudit } from './auditLog'

/** Présences aux séances et progression par enfant (catéchèse). */

export type StatutPresence = 'present' | 'absent' | 'excuse'

export const STATUT_PRESENCE_LABELS: Record<StatutPresence, string> = {
  present: 'Présent',
  absent: 'Absent',
  excuse: 'Excusé',
}

export interface Presence {
  id: string
  seanceId: string
  enfantId: string
  statut: StatutPresence
  note: string | null
}

export interface ModuleValide {
  id: string
  enfantId: string
  coursId: string
  moduleId: string
  statut: 'en_cours' | 'valide'
  date: string
}

export async function getPresencesSeance(seanceId: string): Promise<Presence[]> {
  const { data, error } = await supabase.from('presences').select('*').eq('seance_id', seanceId)
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, seanceId: r.seance_id, enfantId: r.enfant_id, statut: r.statut, note: r.note }))
}

export async function noterPresence(seanceId: string, enfantId: string, statut: StatutPresence): Promise<void> {
  const { error } = await supabase.from('presences').upsert(
    { seance_id: seanceId, enfant_id: enfantId, statut, updated_at: new Date().toISOString() },
    { onConflict: 'seance_id,enfant_id' },
  )
  if (error) throw error
}

export async function getModulesValides(enfantId: string): Promise<ModuleValide[]> {
  const { data, error } = await supabase.from('enfant_progress').select('*').eq('enfant_id', enfantId)
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, enfantId: r.enfant_id, coursId: r.cours_id, moduleId: r.module_id, statut: r.statut, date: r.date }))
}

export async function basculerModuleValide(enfantId: string, coursId: string, moduleId: string, valide: boolean): Promise<void> {
  if (valide) {
    const { error } = await supabase.from('enfant_progress').upsert(
      { enfant_id: enfantId, cours_id: coursId, module_id: moduleId, statut: 'valide', date: new Date().toISOString().slice(0, 10) },
      { onConflict: 'enfant_id,module_id' },
    )
    if (error) throw error
  } else {
    const { error } = await supabase.from('enfant_progress').delete().eq('enfant_id', enfantId).eq('module_id', moduleId)
    if (error) throw error
  }
  await logAudit('update', 'enfant', enfantId, valide ? 'module validé' : 'module retiré')
}

// ── Vue parent ──────────────────────────────────────────────────────────────

export interface SuiviEnfantParent {
  id: string
  prenom: string
  nom: string
  cours: { id: string; titre: string; emoji: string } | null
  modules: { id: string; titre: string; ordre: number; valide: boolean }[]
  presences: { date: string; objectifs: string; statut: StatutPresence }[]
}

/** Enfants rattachés au compte du parent, avec progression et présences. */
export async function getSuiviMesEnfants(userId: string): Promise<SuiviEnfantParent[]> {
  const { data: enfants, error } = await supabase.from('enfants')
    .select('id, prenom, nom, cours_id').eq('parent_profile_id', userId).eq('actif', true).order('prenom')
  if (error) throw error
  return Promise.all((enfants ?? []).map(async e => {
    const [cours, modules, valides, presences] = await Promise.all([
      e.cours_id ? supabase.from('cours').select('id, titre, emoji').eq('id', e.cours_id).maybeSingle() : Promise.resolve({ data: null }),
      e.cours_id ? supabase.from('catechisme_modules').select('id, titre, ordre').eq('cours_id', e.cours_id).order('ordre') : Promise.resolve({ data: [] }),
      supabase.from('enfant_progress').select('module_id').eq('enfant_id', e.id),
      supabase.from('presences').select('statut, seances_catechisme(date, objectifs)').eq('enfant_id', e.id),
    ])
    const faits = new Set((valides.data ?? []).map(v => v.module_id))
    return {
      id: e.id, prenom: e.prenom, nom: e.nom,
      cours: cours.data ?? null,
      modules: (modules.data ?? []).map(m => ({ ...m, valide: faits.has(m.id) })),
      presences: (presences.data ?? []).map(p => {
        const s = (Array.isArray(p.seances_catechisme) ? p.seances_catechisme[0] : p.seances_catechisme) as { date: string; objectifs: string } | null
        return { date: s?.date ?? '', objectifs: s?.objectifs ?? '', statut: p.statut as StatutPresence }
      }).sort((a, b) => b.date.localeCompare(a.date)),
    }
  }))
}

/** Relie la fiche d'un enfant au compte de son parent (qui verra alors son suivi dans son profil). */
export async function lierCompteParent(enfantId: string, email: string): Promise<void> {
  const { data: prof, error: pErr } = await supabase.from('profiles').select('id').ilike('email', email.trim()).maybeSingle()
  if (pErr) throw pErr
  if (!prof) throw new Error("Aucun compte avec cet email : le parent doit d'abord créer son compte (Espace Membre).")
  const { error } = await supabase.from('enfants').update({ parent_profile_id: prof.id, updated_at: new Date().toISOString() }).eq('id', enfantId)
  if (error) throw error
  await logAudit('update', 'enfant', enfantId, 'compte parent relié')
}

export async function getPresencesEnfant(enfantId: string): Promise<{ date: string; objectifs: string; statut: StatutPresence }[]> {
  const { data, error } = await supabase.from('presences').select('statut, seances_catechisme(date, objectifs)').eq('enfant_id', enfantId)
  if (error) throw error
  return (data ?? []).map(p => {
    const s = (Array.isArray(p.seances_catechisme) ? p.seances_catechisme[0] : p.seances_catechisme) as { date: string; objectifs: string } | null
    return { date: s?.date ?? '', objectifs: s?.objectifs ?? '', statut: p.statut as StatutPresence }
  }).sort((a, b) => b.date.localeCompare(a.date))
}
