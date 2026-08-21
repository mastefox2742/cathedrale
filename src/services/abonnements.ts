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
  const { data: existing } = await supabase.from(TABLE).select('id').eq('contact', data.contact).maybeSingle()
  if (existing) return existing.id

  const { data: row, error } = await supabase.from(TABLE).insert({
    canal: data.canal, contact: data.contact, prefs: data.prefs,
    confirme: data.canal === 'whatsapp', // WhatsApp confirmé directement
  }).select('id').single()
  if (error) throw error
  return row.id
}

export async function unsubscribe(contact: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('contact', contact)
  if (error) throw error
}

export async function getAbonnements(): Promise<Abonnement[]> {
  const { data, error } = await supabase.from(TABLE).select('*')
  if (error) throw error
  return (data ?? []).map(fromRow)
}
