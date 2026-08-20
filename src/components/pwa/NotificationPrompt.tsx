import { useEffect, useState } from 'react'
import {
  isNotificationSupported, requestNotificationPermission,
  saveNotificationToken, getStoredToken, storeToken,
  getStoredPrefs, storePrefs, updateNotificationPrefs,
  unsubscribeNotifications, onForegroundMessage,
  NOTIF_LABELS, type NotifPreferences,
} from '../../services/notifications'

export function NotificationPrompt() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [token, setToken] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [prefs, setPrefs] = useState<NotifPreferences>(getStoredPrefs())
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const s = isNotificationSupported()
    setSupported(s)
    if (s) {
      setPermission(Notification.permission)
      const t = getStoredToken()
      setToken(t)
      // Afficher la bannière après 60s si pas encore abonné
      if (!t && Notification.permission === 'default') {
        const timer = setTimeout(() => setShowBanner(true), 60000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  // Écoute les messages en premier plan
  useEffect(() => {
    if (!token) return
    const unsub = onForegroundMessage(payload => {
      setToast(payload.notification?.title ?? 'Nouveau message')
      setTimeout(() => setToast(null), 5000)
    })
    return unsub
  }, [token])

  async function handleSubscribe() {
    setLoading(true)
    try {
      const t = await requestNotificationPermission()
      if (t) {
        await saveNotificationToken(t, prefs)
        storeToken(t)
        storePrefs(prefs)
        setToken(t)
        setPermission('granted')
        setShowBanner(false)
        setToast('Notifications activées ✓')
        setTimeout(() => setToast(null), 3000)
      } else {
        setPermission(Notification.permission)
        setShowBanner(false)
      }
    } finally { setLoading(false) }
  }

  async function handleUpdatePrefs(newPrefs: NotifPreferences) {
    setPrefs(newPrefs)
    storePrefs(newPrefs)
    if (token) await updateNotificationPrefs(token, newPrefs)
  }

  async function handleUnsubscribe() {
    if (!token) return
    await unsubscribeNotifications(token)
    storeToken('')
    setToken(null)
    setPermission('default')
    setShowSettings(false)
    setToast('Notifications désactivées')
    setTimeout(() => setToast(null), 3000)
  }

  if (!supported) return null

  return (
    <>
      {/* Toast message en premier plan */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, background: 'var(--primary)', color: 'white',
          padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}

      {/* Bannière d'invitation aux notifications */}
      {showBanner && permission === 'default' && !token && (
        <div style={{
          position: 'fixed', bottom: 88, left: 16, right: 16, zIndex: 54,
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,35,111,0.15)',
          border: '1px solid rgba(0,35,111,0.1)',
          padding: '16px',
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slide-up-prompt 0.3s ease',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface-container)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>notifications</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>
              Rester connecté à la paroisse
            </p>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
              Recevez l'Évangile du jour et les annonces importantes
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              style={{
                padding: '8px 14px', borderRadius: 10, border: 'none',
                background: 'var(--primary)', color: 'white',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {loading ? '…' : "S'abonner"}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              style={{ padding: '4px', border: 'none', background: 'none', fontSize: 12, color: 'var(--on-surface-variant)', cursor: 'pointer' }}
            >
              Plus tard
            </button>
          </div>
        </div>
      )}

      {/* Bouton cloche (si abonné) */}
      {token && (
        <button
          onClick={() => setShowSettings(true)}
          style={{
            position: 'fixed', bottom: 96, right: 20, zIndex: 45,
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--primary)', color: 'white',
            border: '2px solid white', boxShadow: '0 4px 12px rgba(0,35,111,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Paramètres notifications"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
        </button>
      )}

      {/* Modal paramètres */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{
            background: 'white', borderRadius: '20px 20px 0 0',
            padding: '24px', width: '100%', maxWidth: 480,
            maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)' }}>
                🔔 Mes notifications
              </h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--on-surface-variant)' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(Object.entries(NOTIF_LABELS) as [keyof NotifPreferences, typeof NOTIF_LABELS[keyof NotifPreferences]][]).map(([key, cfg]) => (
                <label
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px', borderRadius: 12, cursor: 'pointer',
                    background: prefs[key] ? 'rgba(0,35,111,0.05)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: prefs[key] ? 'var(--primary)' : 'var(--surface-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: prefs[key] ? 'white' : 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>
                      {cfg.icon}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{cfg.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{cfg.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={e => void handleUpdatePrefs({ ...prefs, [key]: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </label>
              ))}
            </div>

            <button
              onClick={handleUnsubscribe}
              style={{
                width: '100%', marginTop: 20, padding: '12px',
                borderRadius: 12, border: '1.5px solid rgba(198,40,40,0.3)',
                background: 'rgba(198,40,40,0.05)', color: '#c62828',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Se désabonner de toutes les notifications
            </button>
          </div>
        </div>
      )}
    </>
  )
}
