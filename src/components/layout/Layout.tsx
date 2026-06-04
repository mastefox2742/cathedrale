import { type ReactNode } from 'react'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { SideNav } from './SideNav'
import { InstallPrompt } from '../pwa/InstallPrompt'
import { OfflineBanner } from '../pwa/OfflineBanner'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* ══ VERSION DESKTOP (≥ 1024px) ══ */}
      <div className="desktop-layout" style={{ display: 'none' }}>
        <SideNav />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </div>

      {/* ══ VERSION MOBILE (< 1024px) ══ */}
      <div className="mobile-layout">
        <TopBar />
        <main style={{ maxWidth: 720, margin: '0 auto' }}>
          {children}
        </main>
        <BottomNav />
      </div>

      <OfflineBanner />
      <InstallPrompt />

      <style>{`
        @media (min-width: 1024px) {
          .desktop-layout { display: flex !important; min-height: 100dvh; }
          .mobile-layout  { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-layout { display: none !important; }
          .mobile-layout  { display: block !important; }
        }
      `}</style>
    </>
  )
}
