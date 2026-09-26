import { Platform } from 'react-native'
import { parse } from 'node-html-parser'
import AsyncStorage from '@react-native-async-storage/async-storage'

/** Évangile du jour (AELF) : phrase d'accroche et référence, pour l'accueil. */

export interface EvangileDuJour {
  /** Ex. « Ne jugez pas, afin de ne pas être jugés » */
  accroche: string
  /** Ex. Mt 7, 1-5 */
  reference: string
}

const CLE = 'evangile_du_jour_v1_'

function aujourdhui() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getEvangileDuJour(): Promise<EvangileDuJour | null> {
  const date = aujourdhui()
  try {
    const cache = await AsyncStorage.getItem(CLE + date)
    if (cache) return JSON.parse(cache) as EvangileDuJour
  } catch { /* cache facultatif */ }

  const res = await fetch(`https://www.aelf.org/${date}/romain/messe`, {
    headers: { 'User-Agent': Platform.select({ ios: 'Mozilla/5.0 (iPhone)', android: 'Mozilla/5.0 (Android)', default: 'Mozilla/5.0' }) },
  })
  if (!res.ok) return null
  const root = parse(await res.text())
  const lecture = root.querySelectorAll('.lecture').find(el => /[ée]vangile/i.test(el.querySelector('h4')?.text ?? ''))
  const h5 = lecture?.querySelector('h5')?.text.replace(/\s+/g, ' ').trim()
  if (!h5) return null
  const accroche = h5.match(/«\s*([^»]+?)\s*»/)?.[1] ?? h5.replace(/\([^)]*\)/g, '').trim()
  const reference = h5.match(/\(([^)]+)\)\s*$/)?.[1] ?? ''
  const resultat = { accroche, reference }
  try { await AsyncStorage.setItem(CLE + date, JSON.stringify(resultat)) } catch { /* facultatif */ }
  return resultat
}
