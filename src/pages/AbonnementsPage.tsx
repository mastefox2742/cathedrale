import { useState } from 'react'
import { MessageCircle, Mail, BookOpen, Megaphone, Moon, Send } from 'lucide-react'
import { subscribe, type CanalType } from '../services/abonnements'

const WHATSAPP_NUMBER = '+242060000000' // À remplacer

const PREFS_OPTIONS = [
  { key: 'liturgie',   label: 'Évangile du jour',         icon: BookOpen,  desc: 'Chaque matin à 6h00' },
  { key: 'annonces',   label: 'Annonces de la paroisse',  icon: Megaphone, desc: 'Informations importantes' },
  { key: 'meditation', label: 'Méditation du soir',       icon: Moon,      desc: 'Citation spirituelle à 20h' },
  { key: 'newsletter', label: 'Newsletter hebdomadaire',  icon: Send,      desc: 'Résumé du dimanche (email uniquement)' },
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
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <>
      <div className="page-hero" style={{ textAlign: 'center' }}>
        <div className="page-hero-content" style={{ textAlign: 'center', margin: '0 auto' }}>
          <p className="page-hero-eyebrow" style={{ justifyContent: 'center' }}>Merci</p>
          <h1>Vous êtes <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>abonné</em></h1>
        </div>
      </div>
      <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
        <div className="inner" style={{ maxWidth: 440 }}>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: 28 }}>
            {canal === 'whatsapp'
              ? 'Vous recevrez bientôt les messages sur WhatsApp. Ajoutez notre numéro à vos contacts.'
              : 'Vérifiez votre boîte email — un lien de confirmation vous a été envoyé.'}
          </p>
          {canal === 'whatsapp' && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\s/g, '')}?text=Bonjour%2C%20je%20viens%20de%20m%27abonner%20aux%20messages%20de%20la%20Cath%C3%A9drale%20Sacr%C3%A9-C%C5%93ur%20%E2%9C%9D`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ display: 'inline-flex' }}
            >
              <MessageCircle size={15} /> Ouvrir WhatsApp
            </a>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Rester proche de la paroisse</p>
          <h1>Rester <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>connecté</em></h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 14, maxWidth: 420, lineHeight: 1.8 }}>
            Recevez la liturgie du jour et les annonces sur WhatsApp ou par email.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner" style={{ maxWidth: 520 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(193,164,97,.1)', marginBottom: 32 }}>
            {([
              { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, desc: 'Messages instantanés' },
              { key: 'email',    label: 'Email',    Icon: Mail, desc: 'Newsletter & liturgie' },
            ] as const).map(c => (
              <button
                key={c.key}
                onClick={() => setCanal(c.key)}
                style={{
                  padding: '24px 16px', border: 'none', cursor: 'pointer', textAlign: 'center',
                  background: canal === c.key ? 'var(--gold)' : 'var(--anthracite)',
                  color: canal === c.key ? 'var(--black)' : 'var(--white)',
                  transition: 'all .2s',
                }}
              >
                <c.Icon size={26} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{c.label}</p>
                <p style={{ fontSize: 11, opacity: .75 }}>{c.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 8 }}>
                {canal === 'whatsapp' ? 'Numéro WhatsApp' : 'Adresse email'}
              </label>
              <input
                type={canal === 'email' ? 'email' : 'tel'}
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder={canal === 'whatsapp' ? '+242 06 XXX XXXX' : 'votre@email.com'}
                required
                className="dark-input"
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <span className="section-label">Je souhaite recevoir</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'rgba(193,164,97,.06)' }}>
                {PREFS_OPTIONS.map(p => {
                  const disabled = p.key === 'newsletter' && canal === 'whatsapp'
                  return (
                    <label
                      key={p.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px', background: 'var(--surface)',
                        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .4 : 1,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--r-sm)', flexShrink: 0,
                        background: prefs[p.key] && !disabled ? 'var(--primary)' : 'var(--bg-alt)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <p.icon size={16} color={prefs[p.key] && !disabled ? '#fff' : 'var(--text-light)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-light)' }}>{disabled ? 'Email uniquement' : p.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={prefs[p.key] && !disabled}
                        onChange={e => setPrefs(prev => ({ ...prev, [p.key]: e.target.checked }))}
                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                      />
                    </label>
                  )
                })}
              </div>
            </div>

            {error && <p style={{ color: '#C0392B', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>{error}</p>}

            <button type="submit" disabled={loading || !contact.trim()} className="btn-gold" style={{ width: '100%', justifyContent: 'center', opacity: !contact.trim() ? .5 : 1 }}>
              {loading ? 'Inscription…' : canal === 'whatsapp' ? "S'abonner sur WhatsApp" : "S'abonner par email"}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-light)', textAlign: 'center', marginTop: 14 }}>
              Désabonnement possible à tout moment · Aucun spam · Max 2 messages/jour
            </p>
          </form>
        </div>
      </div>
    </>
  )
}
