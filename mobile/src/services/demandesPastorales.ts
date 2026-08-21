import { supabase } from './supabase'

export type TypeDemande =
  | 'bapteme' | 'catechisme' | 'mariage' | 'obseques' | 'certificat'
  | 'intention_messe' | 'accompagnement' | 'benevolat' | 'info_generale'

export const TYPE_DEMANDE_LABELS: Record<TypeDemande, string> = {
  bapteme: 'Baptême',
  catechisme: 'Inscription au catéchisme',
  mariage: 'Mariage',
  obseques: 'Obsèques',
  certificat: 'Certificat / attestation',
  intention_messe: 'Intention de messe',
  accompagnement: 'Accompagnement pastoral',
  benevolat: 'Bénévolat',
  info_generale: "Demande d'information",
}

function generateReference(): string {
  const now = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SC-${now}-${rand}`
}

export async function creerDemande(data: { type: TypeDemande; nom: string; contact: string; message: string }): Promise<string> {
  const reference = generateReference()
  const { error } = await supabase.from('demandes_pastorales').insert({
    reference, type: data.type, nom: data.nom, contact: data.contact, message: data.message,
    statut: 'recue',
  })
  if (error) throw error
  return reference
}
