import { type ReactNode, useEffect } from 'react'
import { Header2 } from './Header2'
import { Footer2 } from './Footer2'
import { InstallPrompt } from '../pwa/InstallPrompt'
import { OfflineBanner } from '../pwa/OfflineBanner'
import { NotificationPrompt } from '../pwa/NotificationPrompt'

interface Layout2Props {
  children: ReactNode
  transparent?: boolean
}

export function Layout2({ children, transparent = false }: Layout2Props) {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 60)
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.08 })

    function observe(root: Element | Document = document) {
      root.querySelectorAll('.reveal:not(.anim)').forEach(el => {
        el.classList.add('anim')
        io.observe(el)
      })
    }

    observe()
    const mo = new MutationObserver(() => observe())
    mo.observe(document.body, { childList: true, subtree: true })

    return () => { io.disconnect(); mo.disconnect() }
  }, [])

  return (
    <div className="v2-theme" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header2 transparent={transparent} />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer2 />

      <OfflineBanner />
      <InstallPrompt />
      <NotificationPrompt />
    </div>
  )
}
