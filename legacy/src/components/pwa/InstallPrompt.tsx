import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Déjà installé en standalone ?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Afficher le prompt après 30s de navigation
      setTimeout(() => setShow(true), 30000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false) })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
    setDeferredPrompt(null)
  }

  if (!show || installed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 88, left: 16, right: 16, zIndex: 55,
      background: 'white', borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,35,111,0.18)',
      border: '1px solid rgba(0,35,111,0.12)',
      padding: '16px',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slide-up-prompt 0.3s ease',
    }}>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, border: '2px solid rgba(0,35,111,0.15)' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>
          Installer l'application
        </p>
        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
          Accédez à la liturgie, aux annonces et aux cours hors connexion
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: 'var(--primary)', color: 'white',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Installer
        </button>
        <button
          onClick={() => setShow(false)}
          style={{
            padding: '4px', border: 'none', background: 'none',
            fontSize: 12, color: 'var(--on-surface-variant)', cursor: 'pointer',
          }}
        >
          Plus tard
        </button>
      </div>
      <style>{`
        @keyframes slide-up-prompt {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
