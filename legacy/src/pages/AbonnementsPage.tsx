import { useState } from 'react'
import { subscribe, type CanalType } from '../services/abonnements'

const WHATSAPP_NUMBER = '+242060000000' // À remplacer

const PREFS_OPTIONS = [
  { key: 'liturgie',   label: 'Évangile du jour',      icon: 'menu_book',     desc: 'Chaque matin à 6h00' },
  { key: 'annonces',   label: 'Annonces de la paroisse', icon: 'campaign',    desc: 'Informations importantes' },
  { key: 'meditation', label: 'Méditation du soir',    icon: 'self_improvement', desc: 'Citation spirituelle à 20h' },
  { key: 'newsletter', label: 'Newsletter hebdomadaire', icon: 'mail',        desc: 'Résumé du dimanche (email uniquement)' },
] as const

export function AbonnementsPage() {
  const [canal, setCanal] = useState<CanalType>('whatsapp')
  const [contact, setContact] = useState('')
  const [prefs, setPrefs] = useState({
    liturgie: true, annonces: true, meditation: false, newsletter: false,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contact.trim()) return
    setLoading(true)
    setError('')
    try {
      await subscribe({ canal, contact: contact.trim(), prefs })
      setSuccess(true)
    } catch (_) {
      setError('Une erreur est survenue. Réessayez.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div style={{ padding: '40px var(--margin)', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--primary)', marginBottom: 12 }}>
        Vous êtes abonné !
      </h2>
      <p style={{ color: 'var(--on-surface-variant)', fontSize: 15, lineHeight: 1.6, maxWidth: 340, margin: '0 auto 24px' }}>
        {canal === 'whatsapp'
          ? 'Vous recevrez bientôt les messages sur WhatsApp. Ajoutez notre numéro à vos contacts.'
          : 'Vérifiez votre boîte email — un lien de confirmation vous a été envoyé.'}
      </p>
      {canal === 'whatsapp' && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\s/g, '')}?text=Bonjour%2C%20je%20viens%20de%20m%27abonner%20aux%20messages%20de%20la%20Cath%C3%A9drale%20Sacr%C3%A9-C%C5%93ur%20%E2%9C%9D`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 12,
            background: '#25D366', color: 'white',
            textDecoration: 'none', fontSize: 15, fontWeight: 700,
          }}
        >
          💬 Ouvrir WhatsApp
        </a>
      )}
    </div>
  )

  return (
    <div style={{ padding: '0 var(--margin) var(--space-lg)' }}>

      {/* Header */}
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>
          Rester connecté
        </h1>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
          Recevez la liturgie du jour et les annonces sur WhatsApp ou par email
        </p>
      </div>

      {/* Choix canal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {([
          { key: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366', desc: 'Messages instantanés' },
          { key: 'email',    label: 'Email',    icon: '✉️', color: '#1565C0', desc: 'Newsletter & liturgie' },
        ] as const).map(c => (
          <button
            key={c.key}
            onClick={() => setCanal(c.key)}
            style={{
              padding: '16px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: canal === c.key ? c.color : 'var(--surface-container)',
              color: canal === c.key ? 'white' : 'var(--on-surface)',
              transition: 'all 0.2s', textAlign: 'center',
              boxShadow: canal === c.key ? `0 4px 16px ${c.color}44` : 'none',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 6 }}>{c.icon}</div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{c.label}</p>
            <p style={{ fontSize: 12, opacity: 0.8 }}>{c.desc}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Contact */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', display: 'block', marginBottom: 8 }}>
            {canal === 'whatsapp' ? '📱 Numéro WhatsApp' : '✉️ Adresse email'}
          </label>
          <input
            type={canal === 'email' ? 'email' : 'tel'}
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder={canal === 'whatsapp' ? '+242 06 XXX XXXX' : 'votre@email.com'}
            required
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 16,
              border: '1.5px solid rgba(0,35,111,0.15)', fontFamily: 'var(--font-sans)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Préférences */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 12 }}>
            Je souhaite recevoir :
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PREFS_OPTIONS.map(p => {
              const disabled = p.key === 'newsletter' && canal === 'whatsapp'
              return (
                <label
                  key={p.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px', borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
                    background: prefs[p.key] && !disabled ? 'rgba(0,35,111,0.05)' : 'transparent',
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: prefs[p.key] && !disabled ? 'var(--primary)' : 'var(--surface-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: 20, color: prefs[p.key] && !disabled ? 'white' : 'var(--on-surface-variant)',
                      fontVariationSettings: "'FILL' 1",
                    }}>{p.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>{p.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {disabled ? 'Email uniquement' : p.desc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={prefs[p.key] && !disabled}
                    onChange={e => setPrefs(prev => ({ ...prev, [p.key]: e.target.checked }))}
                    style={{ width: 20, height: 20, accentColor: 'var(--primary)' }}
                  />
                </label>
              )
            })}
          </div>
        </div>

        {error && (
          <p style={{ color: '#c62828', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !contact.trim()}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: canal === 'whatsapp' ? '#25D366' : 'var(--primary)',
            color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            opacity: !contact.trim() ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? 'Inscription…' : canal === 'whatsapp' ? '💬 S\'abonner sur WhatsApp' : '✉️ S\'abonner par email'}
        </button>

        <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 12 }}>
          Désabonnement possible à tout moment · Aucun spam · Max 2 messages/jour
        </p>
      </form>
    </div>
  )
}
