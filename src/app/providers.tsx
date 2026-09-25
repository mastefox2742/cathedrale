'use client'

import { useEffect, type ReactNode } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { ParoisseProvider } from '../contexts/ParoisseContext'

/** Service worker PWA (cache hors-ligne) — enregistré en production uniquement. */
function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }, [])
}

export function Providers({ children }: { children: ReactNode }) {
  useServiceWorker()
  return (
    <AuthProvider>
      <ParoisseProvider>{children}</ParoisseProvider>
    </AuthProvider>
  )
}
