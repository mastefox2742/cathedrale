import { type ReactNode } from 'react'

/**
 * Wrapper commun pour toutes les pages.
 * Mobile : padding standard 20px
 * Desktop (≥1024px) : géré par le SideNav layout + padding 56px via CSS
 */
export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ padding: '0 var(--margin) var(--space-lg)' }} className="page-inner">
        {children}
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .desktop-layout main .page-inner {
            padding: 0 56px 80px !important;
            max-width: 1100px;
          }
          .desktop-layout main .page-inner .text-headline-lg {
            font-size: 40px;
            line-height: 48px;
          }
          .desktop-layout main .page-inner .text-title-md {
            font-size: 24px;
            line-height: 32px;
          }
          .desktop-layout main .page-inner .card {
            border-radius: 14px;
          }
          /* Grilles desktop dans les pages */
          .desktop-layout main .page-inner .responsive-grid-2 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .desktop-layout main .page-inner .responsive-grid-3 {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 20px !important;
          }
          .desktop-layout main .page-inner .responsive-grid-4 {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 20px !important;
          }
        }
        @media (min-width: 1280px) {
          .desktop-layout main .page-inner {
            padding: 0 64px 80px !important;
          }
        }
      `}</style>
    </>
  )
}
