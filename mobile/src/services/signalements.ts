import { supabase } from './supabase'
import { getParoisseCourante } from './paroisses'

export async function creerSignalement(data: {
  concerne?: string; description: string; reporterNom?: string; reporterContact?: string
}): Promise<void> {
  const { error } = await supabase.from('signalements').insert({
    ...(getParoisseCourante() ? { parish_id: getParoisseCourante() } : {}),
    concerne: data.concerne || null, description: data.description,
    reporter_nom: data.reporterNom || null, reporter_contact: data.reporterContact || null,
  })
  if (error) throw error
}
