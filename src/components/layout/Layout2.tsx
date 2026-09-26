'use client'

import type { ReactNode } from 'react'
import { Header2 } from './Header2'
import { Footer2 } from './Footer2'
import { InstallPrompt } from '../pwa/InstallPrompt'
import { OfflineBanner } from '../pwa/OfflineBanner'
import { NotificationPrompt } from '../pwa/NotificationPrompt'
import { useParoisse } from '../../contexts/ParoisseContext'
import { usePathname } from 'next/navigation'

interface Layout2Props {
  children: ReactNode
  transparent?: boolean
}

export function Layout2({ children, transparent }: Layout2Props) {
  // L'en-tête est transparent sur l'accueil (grand visuel), opaque ailleurs.
  const pathname = usePathname()
  const enteteTransparent = transparent ?? pathname === '/'
  const { courante } = useParoisse()

  return (
    <div className="v2-theme" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header2 transparent={enteteTransparent} />
      {/* Remonté quand le visiteur change de paroisse : chaque page recharge ses contenus. */}
      <main key={courante?.id ?? 'defaut'} style={{ flex: 1 }}>
        {children}
      </main>
      <Footer2 />

      <OfflineBanner />
      <InstallPrompt />
      <NotificationPrompt />
    </div>
  )
}
