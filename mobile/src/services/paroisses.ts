import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

/**
 * Paroisse choisie dans l'application (mémorisée sur l'appareil). Les
 * contenus affichés = ceux de cette paroisse + ceux de l'archidiocèse.
 * Même logique que le site (src/services/scope.ts).
 */

const CLE = 'paroisse-courante'
let courante: string | null = null
const abonnes = new Set<() => void>()

export interface Paroisse {
  id: string
  nom: string
  slug: string
  description: string | null
  cure: string | null
  adresse: string | null
  quartier: string | null
  telephone: string | null
  email: string | null
  whatsapp: string | null
  latitude: number | null
  longitude: number | null
  horaires: { messes?: { jour: string; horaires: string[] }[]; confessions?: string; permanence?: string }
}

export async function chargerParoisseCourante(): Promise<string | null> {
  try { courante = await AsyncStorage.getItem(CLE) } catch { courante = null }
  return courante
}

export function getParoisseCourante(): string | null {
  return courante
}

export async function setParoisseCourante(id: string): Promise<void> {
  courante = id
  abonnes.forEach(fn => fn())
  try { await AsyncStorage.setItem(CLE, id) } catch { /* reste en mémoire */ }
}

export function surChangementParoisse(fn: () => void): () => void {
  abonnes.add(fn)
  return () => { abonnes.delete(fn) }
}

interface Filtrable { or(filters: string): unknown }

/** Paroisse choisie + contenus archidiocésains (parish_id null). */
export function filtreParoisse<T>(query: T): T {
  return courante ? (query as unknown as Filtrable).or(`parish_id.is.null,parish_id.eq.${courante}`) as T : query
}

export async function getParoisses(): Promise<Paroisse[]> {
  const { data, error } = await supabase.from('parishes').select('*').eq('actif', true).order('nom')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, nom: r.nom, slug: r.slug, description: r.description, cure: r.cure, adresse: r.adresse,
    quartier: r.quartier, telephone: r.telephone, email: r.email, whatsapp: r.whatsapp,
    latitude: r.latitude, longitude: r.longitude, horaires: r.horaires ?? {},
  }))
}
