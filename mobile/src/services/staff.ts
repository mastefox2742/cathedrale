import { supabase } from './supabase'

/** Rôles et alertes du staff — mêmes règles que le site (la base applique les droits). */

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur de la plateforme', archeveque: 'Archevêque', admin_diocesain: 'Administrateur diocésain',
  admin_evangelisation: 'Responsable évangélisation', coordinateur_catechese_diocesain: 'Coordinateur diocésain de la catéchèse',
  responsable_media_diocesain: 'Responsable média diocésain', responsable_securite: 'Responsable protection des mineurs',
  admin_paroisse: 'Administrateur de paroisse', pretre: 'Prêtre', secretariat: 'Secrétariat', tresorier: 'Trésorier',
  coordinateur_catechese: 'Coordinateur catéchèse', catechiste: 'Catéchiste', staff_media: 'Équipe média', redacteur: 'Rédacteur',
  responsable_groupe: 'Responsable de groupe', animateur_jeunesse: 'Animateur Jeunesse', responsable_liturgie: 'Responsable liturgie',
  parent: 'Parent', benevole: 'Bénévole', membre: 'Membre',
}

const PARISH_STAFF = ['admin_paroisse', 'pretre', 'secretariat', 'tresorier', 'coordinateur_catechese', 'catechiste',
  'staff_media', 'redacteur', 'responsable_groupe', 'animateur_jeunesse', 'responsable_liturgie', 'responsable_securite']

export interface MesRoles {
  global: string | null
  paroisses: { paroisse: string; role: string }[]
  estStaff: boolean
}

export async function getMesRoles(userId: string): Promise<MesRoles> {
  const [{ data: prof }, { data: membres }] = await Promise.all([
    supabase.from('profiles').select('role, actif').eq('id', userId).maybeSingle(),
    supabase.from('parish_members').select('role, parishes(nom)').eq('user_id', userId),
  ])
  const paroisses = (membres ?? []).filter(m => m.role !== 'membre').map(m => {
    const p = (Array.isArray(m.parishes) ? m.parishes[0] : m.parishes) as { nom: string } | null
    return { paroisse: p?.nom ?? '', role: m.role as string }
  })
  const actif = prof?.actif !== false
  return {
    global: prof?.role ?? null,
    paroisses,
    estStaff: actif && (!!prof?.role || paroisses.some(p => PARISH_STAFF.includes(p.role))),
  }
}

export interface Alerte { id: string; type: string; titre: string; lien: string; createdAt: string; lue: boolean }

export async function getAlertes(userId: string): Promise<Alerte[]> {
  const [{ data, error }, { data: lues }] = await Promise.all([
    supabase.from('alertes').select('id, type, titre, lien, created_at').order('created_at', { ascending: false }).limit(40),
    supabase.from('alertes_lues').select('alerte_id').eq('user_id', userId),
  ])
  if (error) throw error
  const set = new Set((lues ?? []).map(l => l.alerte_id))
  return (data ?? []).map(a => ({ id: a.id, type: a.type, titre: a.titre, lien: a.lien, createdAt: a.created_at, lue: set.has(a.id) }))
}

export async function marquerLue(userId: string, alerteId: string): Promise<void> {
  await supabase.from('alertes_lues').upsert({ user_id: userId, alerte_id: alerteId }, { onConflict: 'user_id,alerte_id', ignoreDuplicates: true })
}
