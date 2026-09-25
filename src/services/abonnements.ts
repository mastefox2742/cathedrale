import { supabase } from './supabase'

export type CanalType = 'email' | 'whatsapp'

export interface Abonnement {
  id?: string
  canal: CanalType
  contact: string       // email ou numéro WhatsApp (+242...)
  prefs: {
    liturgie: boolean   // Évangile du jour
    annonces: boolean   // Annonces urgentes
    meditation: boolean // Méditation du soir
    newsletter: boolean // Newsletter hebdo (email seulement)
  }
  confirme: boolean
  createdAt?: string
}

const TABLE = 'abonnements'

interface AbonnementRow {
  id: string
  canal: CanalType
  contact: string
  prefs: Abonnement['prefs']
  confirme: boolean
  created_at: string
}

function fromRow(r: AbonnementRow): Abonnement {
  return { id: r.id, canal: r.canal, contact: r.contact, prefs: r.prefs, confirme: r.confirme, createdAt: r.created_at }
}

export async function subscribe(data: Omit<Abonnement, 'id' | 'createdAt' | 'confirme'>): Promise<string> {
  // Passe par une fonction SQL : le public n'a plus le droit de lire la table
  const { data: id, error } = await supabase.rpc('s_abonner', {
    p_canal: data.canal, p_contact: data.contact, p_prefs: data.prefs,
  })
  if (error) throw error
  return id as string
}

export async function unsubscribe(contact: string): Promise<void> {
  const { error } = await supabase.rpc('se_desabonner', { p_contact: contact })
  if (error) throw error
}

export async function getAbonnements(): Promise<Abonnement[]> {
  const { data, error } = await supabase.from(TABLE).select('*')
  if (error) throw error
  return (data ?? []).map(fromRow)
}
