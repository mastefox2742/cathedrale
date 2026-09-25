import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { getParoisses, type Paroisse } from '../services/paroisses'
import { subscribeScope, getParoissePublique, setParoissePublique } from '../services/scope'

/** Paroisse affichée par défaut tant que le visiteur n'en a pas choisi une autre. */
export const PAROISSE_PAR_DEFAUT = 'cathedrale-sacre-coeur'

interface ParoisseContextValue {
  paroisses: Paroisse[]
  courante: Paroisse | null
  choisir: (id: string) => void
  chargement: boolean
}

const ParoisseContext = createContext<ParoisseContextValue>({
  paroisses: [], courante: null, choisir: () => {}, chargement: true,
})

export function ParoisseProvider({ children }: { children: ReactNode }) {
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [chargement, setChargement] = useState(true)
  const courantId = useSyncExternalStore(subscribeScope, getParoissePublique)

  useEffect(() => {
    getParoisses()
      .then(setParoisses)
      .catch(() => setParoisses([]))
      .finally(() => setChargement(false))
  }, [])

  // Choix absent ou paroisse devenue inactive : retour à la paroisse par défaut.
  useEffect(() => {
    if (paroisses.length === 0) return
    if (courantId && paroisses.some(p => p.id === courantId)) return
    const defaut = paroisses.find(p => p.slug === PAROISSE_PAR_DEFAUT) ?? paroisses[0]
    setParoissePublique(defaut.id)
  }, [paroisses, courantId])

  const courante = paroisses.find(p => p.id === courantId) ?? null

  return (
    <ParoisseContext.Provider value={{ paroisses, courante, choisir: setParoissePublique, chargement }}>
      {children}
    </ParoisseContext.Provider>
  )
}

export const useParoisse = () => useContext(ParoisseContext)
