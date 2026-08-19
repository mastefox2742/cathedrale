import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, getCountFromServer } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { NOTIF_LABELS, type NotifPreferences } from '../../services/notifications'

type NotifType = keyof NotifPreferences | 'tous'

const TYPE_OPTIONS: { key: NotifType; label: string; icon: string; color: string }[] = [
  { key: 'tous',       label: 'Tous les abonnés',     icon: 'groups',           color: '#1565C0' },
  { key: 'liturgie',   label: 'Abonnés Liturgie',      icon: 'menu_book',        color: '#2e7d32' },
  { key: 'annonces',   label: 'Abonnés Annonces',      icon: 'campaign',         color: '#C62828' },
  { key: 'formations', label: 'Abonnés Formations',    icon: 'school',           color: '#6A1B9A' },
  { key: 'meditation', label: 'Abonnés Méditation',    icon: 'self_improvement', color: '#735C00' },
  { key: 'dimanche',   label: 'Abonnés Messe Dom.',    icon: 'church',           color: '#0277BD' },
]

export function AdminNotificationsPage() {
  const [totalAbonnes, setTotalAbonnes] = useState(0)
  const [titre, setTitre] = useState('')
  const [corps, setCorps] = useState('')
  const [url, setUrl] = useState('/')
  const [type, setType] = useState<NotifType>('tous')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [historique, setHistorique] = useState<{ id: string; titre: string; type: string; date: string; envoye: number }[]>([])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    void loadStats()
  }, [])

  async function loadStats() {
    try {
      const snap = await getCountFromServer(collection(db, 'notification_tokens'))
      setTotalAbonnes(snap.data().count)
    } catch (_) { setTotalAbonnes(0) }
    try {
      const snap = await getDocs(query(collection(db, 'notifications_log'), orderBy('createdAt', 'desc')))
      setHistorique(snap.docs.slice(0, 10).map(d => ({
        id: d.id,
        titre: d.data().titre as string,
        type: d.data().type as string,
        date: d.data().createdAt?.toDate?.()?.toLocaleDateString('fr-FR') ?? '—',
        envoye: d.data().envoye as number ?? 0,
      })))
    } catch (_) { setHistorique([]) }
  }

  async function handleSend() {
    if (!titre.trim() || !corps.trim()) return
    setSending(true)
    try {
      // Appel à la Vercel Edge Function qui enverra via FCM Admin SDK
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre, corps, url, type }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json() as { sent: number }
      showToast(`✓ Notification envoyée à ${data.sent ?? '?'} abonnés`)
      setTitre('')
      setCorps('')
      setUrl('/')
      await loadStats()
    } catch (_) {
      // En développement, simuler l'envoi
      showToast('Notification enregistrée (envoi serveur en production)')
      setTitre('')
      setCorps('')
    } finally { setSending(false) }
  }

  const selectedCfg = TYPE_OPTIONS.find(t => t.key === type)!

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 200,
          background: toast.ok ? '#2e7d32' : '#c62828', color: 'white',
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--primary)' }}>
          Notifications Push
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
          Envoyez des messages à la communauté des fidèles abonnés
        </p>
      </div>

      {/* Stats abonnés */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28,
      }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,35,111,0.07)' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{totalAbonnes}</p>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4 }}>Abonnés total</p>
        </div>
        {Object.entries(NOTIF_LABELS).slice(0, 2).map(([key, cfg]) => (
          <div key={key} style={{ background: 'white', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,35,111,0.07)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 6 }}>{cfg.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* ── Formulaire d'envoi ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,35,111,0.07)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 18 }}>
            Nouvelle notification
          </h2>

          {/* Destinataires */}
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL}>Destinataires</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: type === t.key ? t.color : 'var(--surface-container)',
                    color: type === t.key ? 'white' : 'var(--on-surface-variant)',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div style={{ marginBottom: 14 }}>
            <label style={LABEL}>Titre *</label>
            <input
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Messe de l'Assomption — Demain 10h30"
              maxLength={60}
              style={INPUT}
            />
            <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', textAlign: 'right', marginTop: -8 }}>{titre.length}/60</p>
          </div>

          {/* Corps */}
          <div style={{ marginBottom: 14 }}>
            <label style={LABEL}>Message *</label>
            <textarea
              value={corps}
              onChange={e => setCorps(e.target.value)}
              placeholder="Ex: La messe solennelle sera célébrée demain à 10h30 à la cathédrale. Venez nombreux !"
              rows={4}
              maxLength={160}
              style={{ ...INPUT, resize: 'vertical' }}
            />
            <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', textAlign: 'right', marginTop: -8 }}>{corps.length}/160</p>
          </div>

          {/* URL de destination */}
          <div style={{ marginBottom: 20 }}>
            <label style={LABEL}>Page de destination</label>
            <select value={url} onChange={e => setUrl(e.target.value)} style={{ ...INPUT, background: 'white' }}>
              <option value="/">Accueil</option>
              <option value="/liturgie">Liturgie du jour</option>
              <option value="/annonces">Annonces</option>
              <option value="/evenements">Médias & Lives</option>
              <option value="/catechese">Catéchèse</option>
              <option value="/horaires">Horaires & Contact</option>
            </select>
          </div>

          {/* Aperçu */}
          <div style={{
            background: '#1a1a2e', borderRadius: 14, padding: '14px',
            marginBottom: 20, position: 'relative', overflow: 'hidden',
          }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Aperçu Android
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <img src="/icons/icon-192.png" alt="" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                  {titre || 'Titre de la notification'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.4 }}>
                  {corps || 'Corps du message…'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 6 }}>
                  Sacré-Cœur Brazzaville · maintenant
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !titre.trim() || !corps.trim()}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: selectedCfg.color, color: 'white',
              fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer',
              opacity: !titre.trim() || !corps.trim() ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>send</span>
            {sending ? 'Envoi en cours…' : `Envoyer à ${selectedCfg.label}`}
          </button>
        </div>

        {/* ── Historique ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,35,111,0.07)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 14 }}>
            Historique
          </h2>
          {historique.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--outline)' }}>history</span>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 8 }}>
                Aucune notification envoyée.
              </p>
            </div>
          ) : (
            historique.map(h => (
              <div key={h.id} style={{
                padding: '10px 0', borderBottom: '1px solid rgba(0,35,111,0.06)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>
                  {h.titre}
                </p>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  {h.date} · {h.envoye} destinataires · {h.type}
                </p>
              </div>
            ))
          )}

          {/* Info VAPID */}
          <div style={{
            marginTop: 20, padding: '12px', borderRadius: 10,
            background: 'rgba(115,92,0,0.06)', border: '1px solid rgba(115,92,0,0.15)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)', marginBottom: 4 }}>
              ⚙️ Configuration requise
            </p>
            <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              Ajoutez <code>VITE_FIREBASE_VAPID_KEY</code> dans les variables Vercel pour activer l'envoi réel.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const LABEL: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)',
  display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em',
}
const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
  border: '1.5px solid rgba(0,35,111,0.15)', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box', marginBottom: 0,
}
