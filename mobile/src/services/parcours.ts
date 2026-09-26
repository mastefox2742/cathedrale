import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { filtreParoisse } from './paroisses'

export type TypeParcours = 'decouvrir' | 'conversion' | 'approfondir' | 'neuvaine' | 'retraite' | 'formation_staff'

export const TYPE_PARCOURS: Record<TypeParcours, { titre: string; accroche: string }> = {
  decouvrir: { titre: 'Je découvre la foi', accroche: 'Pour les curieux, ceux qui cherchent, ceux qui doutent.' },
  conversion: { titre: 'Je veux me convertir', accroche: 'Devenir chrétien : les étapes, un accompagnement.' },
  approfondir: { titre: 'Approfondir ma foi', accroche: 'Bible, doctrine, vie spirituelle, engagement.' },
  neuvaine: { titre: 'Neuvaines', accroche: 'Neuf jours de prière confiante.' },
  retraite: { titre: 'Retraites en ligne', accroche: 'Quelques jours pour se poser avec Dieu.' },
  formation_staff: { titre: 'Formations du staff', accroche: 'Pour les catéchistes et encadrants.' },
}

export interface QuizQuestion { question: string; reponses: string[]; bonneReponse: number; explication?: string }

export interface Parcours {
  id: string
  type: TypeParcours
  titre: string
  slug: string
  description: string
  emoji: string
  duree: string | null
}

export interface Etape {
  id: string
  pathId: string
  ordre: number
  titre: string
  contenu: string
  videoUrl: string | null
  quiz: QuizQuestion[]
  appelAction: 'aucun' | 'parler_pretre' | 'commencer_parcours' | 'demarche' | 'prier'
}

export async function getParcoursPublies(types: TypeParcours[]): Promise<Parcours[]> {
  const { data, error } = await filtreParoisse(supabase.from('evangelization_paths').select('id, type, titre, slug, description, emoji, duree').eq('publie', true))
    .in('type', types).order('ordre')
  if (error) throw error
  return data ?? []
}

export async function getEtapes(pathId: string): Promise<Etape[]> {
  const { data, error } = await supabase.from('path_steps').select('*').eq('path_id', pathId).order('ordre')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, pathId: r.path_id, ordre: r.ordre, titre: r.titre, contenu: r.contenu,
    videoUrl: r.video_url, quiz: r.quiz ?? [], appelAction: r.appel_action,
  }))
}

export async function getEtapesTerminees(userId: string, pathId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('user_path_progress').select('step_id').eq('user_id', userId).eq('path_id', pathId)
  if (error) throw error
  return new Set((data ?? []).map(r => r.step_id))
}

export async function terminerEtape(userId: string, etape: Etape, score?: number): Promise<void> {
  const { error } = await supabase.from('user_path_progress').upsert(
    { user_id: userId, step_id: etape.id, path_id: etape.pathId, score: score ?? null },
    { onConflict: 'user_id,step_id', ignoreDuplicates: true },
  )
  if (error) throw error
}

/* ── Progression sans compte (maquette : « Sans compte requis ») ──
 * Toujours mémorisée sur l'appareil ; recopiée dans user_path_progress
 * quand la personne est connectée. */

const CLE_PROGRES = 'parcours-progres-'
const CLE_ENREGISTRES = 'parcours-enregistres'

async function progresLocal(pathId: string): Promise<Set<string>> {
  try { return new Set(JSON.parse((await AsyncStorage.getItem(CLE_PROGRES + pathId)) ?? '[]')) } catch { return new Set() }
}

export async function getProgression(pathId: string): Promise<Set<string>> {
  const faites = await progresLocal(pathId)
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    try { (await getEtapesTerminees(data.session.user.id, pathId)).forEach(id => faites.add(id)) } catch { /* hors ligne */ }
  }
  return faites
}

export async function marquerEtape(etape: Etape): Promise<void> {
  const faites = await progresLocal(etape.pathId)
  faites.add(etape.id)
  try { await AsyncStorage.setItem(CLE_PROGRES + etape.pathId, JSON.stringify([...faites])) } catch { /* facultatif */ }
  const { data } = await supabase.auth.getSession()
  if (data.session) await terminerEtape(data.session.user.id, etape)
}

export async function getParcoursEnregistres(): Promise<string[]> {
  try { return JSON.parse((await AsyncStorage.getItem(CLE_ENREGISTRES)) ?? '[]') } catch { return [] }
}

export async function basculerEnregistrement(pathId: string): Promise<boolean> {
  const liste = await getParcoursEnregistres()
  const enregistre = !liste.includes(pathId)
  const suivante = enregistre ? [...liste, pathId] : liste.filter(id => id !== pathId)
  try { await AsyncStorage.setItem(CLE_ENREGISTRES, JSON.stringify(suivante)) } catch { /* facultatif */ }
  return enregistre
}
