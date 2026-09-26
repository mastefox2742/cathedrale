import { supabase } from './supabase'
import { filtreAdmin, parishIdPourCreation } from './scope'

export type AuditAction = 'create' | 'update' | 'delete'

export interface AuditLog {
  id: string
  action: AuditAction
  resource: string
  resourceId: string
  summary: string | null
  userId: string
  userEmail: string
  createdAt: string
}

export const RESOURCE_LABELS: Record<string, string> = {
  annonce: 'Annonce',
  homelie: 'Homélie',
  formation: 'Formation',
  cours: 'Cours de catéchisme',
  module: 'Module de catéchisme',
  evenement: 'Événement',
  media: 'Média',
  groupe: 'Groupe',
  projet_don: 'Projet de don',
  seance_catechisme: 'Séance de catéchisme',
  formation_catechisme: 'Formation (catéchisme)',
  temoignage: 'Témoignage',
  service_paroissial: 'Service paroissial',
  lecon: 'Leçon',
  enfant: 'Fiche enfant',
  consentement: 'Consentement parental',
  signalement: 'Signalement',
  paroisse: 'Paroisse',
  membre_paroisse: 'Rôle paroissial',
  parcours: 'Parcours de foi',
  etape_parcours: 'Étape de parcours',
  direct: 'Direct programmé',
  playlist: 'Playlist',
  don: 'Don',
  adhesion: 'Adhésion à un groupe',
  abonne: 'Abonné',
  archidiocese: 'Archidiocèse',
  charte: 'Charte',
}

/** Ne doit jamais faire échouer l'action admin qu'elle accompagne. */
export async function logAudit(action: AuditAction, resource: string, resourceId: string, summary?: string): Promise<void> {
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return
  try {
    const { error } = await supabase.from('audit_logs').insert({
      action, resource, resource_id: resourceId, summary: summary ?? null, parish_id: parishIdPourCreation(),
      user_id: user.id, user_email: user.email ?? 'inconnu',
    })
    if (error) throw error
  } catch (err) {
    console.warn('Journal d\'audit non enregistré', err)
  }
}

export async function getAuditLogs(max = 200): Promise<AuditLog[]> {
  const { data, error } = await filtreAdmin(supabase
    .from('audit_logs')
    .select('*'))
    .order('created_at', { ascending: false })
    .limit(max)
  if (error) throw error
  return (data ?? []).map(d => ({
    id: d.id, action: d.action, resource: d.resource, resourceId: d.resource_id,
    summary: d.summary, userId: d.user_id, userEmail: d.user_email, createdAt: d.created_at,
  }))
}
