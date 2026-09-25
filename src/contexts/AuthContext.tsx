import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  onAuthChange, getUserProfile, isStaffRole, isDiocesanAdmin, canWorkDiocesan,
  PARISH_STAFF_ROLES, type UserProfile, type Role,
} from '../services/auth'
import { getMesAppartenances, type Appartenance } from '../services/paroisses'
import { subscribeScope, getPerimetreAdmin, ARCHIDIOCESE } from '../services/scope'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  appartenances: Appartenance[]
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null, profile: null, appartenances: [], loading: true, refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [appartenances, setAppartenances] = useState<Appartenance[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (u: User | null) => {
    setUser(u)
    if (u) {
      const [p, a] = await Promise.all([getUserProfile(u.id), getMesAppartenances(u.id).catch(() => [])])
      setProfile(p)
      setAppartenances(a)
    } else {
      setProfile(null)
      setAppartenances([])
    }
    setLoading(false)
  }, [])

  useEffect(() => onAuthChange(load), [load])

  const refresh = useCallback(async () => {
    if (user) await load(user)
  }, [user, load])

  return (
    <AuthContext.Provider value={{ user, profile, appartenances, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export interface Droits {
  /** Rôles effectifs dans le périmètre admin courant (rôle global + rôles de la paroisse). */
  roles: Role[]
  /** A accès au panneau d'administration (au moins un rôle de staff quelque part). */
  isStaff: boolean
  isDiocesanAdmin: boolean
  /** Peut travailler au niveau « tout l'archidiocèse ». */
  peutArchidiocese: boolean
  /** Paroisses où la personne a un rôle de staff (toutes si admin diocésain : liste vide = pas de restriction). */
  paroissesStaff: string[]
  perimetre: string | null
}

export function useDroits(): Droits {
  const { profile, appartenances } = useAuth()
  const perimetre = useSyncExternalStore(subscribeScope, getPerimetreAdmin)

  return useMemo(() => {
    const global = profile?.actif && profile.role ? [profile.role] : []
    const staffApp = profile?.actif ? appartenances.filter(a => PARISH_STAFF_ROLES.includes(a.role)) : []
    const paroissesStaff = [...new Set(staffApp.map(a => a.parishId))]
    const locaux = perimetre && perimetre !== ARCHIDIOCESE
      ? appartenances.filter(a => a.parishId === perimetre).map(a => a.role)
      : []
    const roles: Role[] = [...new Set<Role>([...global, ...locaux])]
    return {
      roles,
      isStaff: global.some(r => isStaffRole(r)) || staffApp.length > 0,
      isDiocesanAdmin: isDiocesanAdmin(global),
      peutArchidiocese: canWorkDiocesan(global),
      paroissesStaff,
      perimetre,
    }
  }, [profile, appartenances, perimetre])
}
