import { useState } from 'react'
import { Link } from 'react-router-dom'
import { creerSignalement } from '../services/signalements'

export function SignalerPage() {
  const [concerne, setConcerne] = useState('')
  const [description, setDescription] = useState('')
  const [reporterNom, setReporterNom] = useState('')
  const [reporterContact, setReporterContact] = useState('')
  const [societe, setSociete] = useState('') // champ honeypot — invisible pour un humain
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [envoye, setEnvoye] = useState(false)

  const valide = description.trim().length > 9

  async function handleSubmit() {
    if (societe) return // honeypot rempli → soumission ignorée silencieusement
    if (!valide) return setError('Merci de décrire votre préoccupation (au moins quelques mots).')
    setError('')
    setLoading(true)
    try {
      await creerSignalement({
        concerne: concerne.trim() || undefined,
        description: description.trim(),
        reporterNom: reporterNom.trim() || undefined,
        reporterContact: reporterContact.trim() || undefined,
      })
      setEnvoye(true)
    } catch {
      setError("Une erreur est survenue. Merci de réessayer dans un instant.")
    } finally {
      setLoading(false)
    }
  }

  if (envoye) {
    return (
      <div className="page-hero" style={{ paddingBottom: 0 }}>
        <div className="inner" style={{ position: 'relative', zIndex: 2, paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🛡️</div>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 24, color: 'var(--primary)', marginBottom: 4 }}>
              Signalement reçu
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24, lineHeight: 1.7 }}>
              Merci d'avoir pris le temps de signaler cette préoccupation. Elle a été transmise en
              toute confidentialité à la personne responsable de la sécurité des mineurs dans la
              paroisse, qui la traitera dans les meilleurs délais.
            </p>
            <Link to="/" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-hero" style={{ textAlign: 'center' }}>
        <div className="page-hero-content" style={{ textAlign: 'center', maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <p className="page-hero-eyebrow" style={{ justifyContent: 'center' }}>Protection des mineurs</p>
          <h1>Signaler une <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>préoccupation</em></h1>
          <p style={{ marginTop: 16, fontSize: 15, color: 'var(--text-mid)', fontWeight: 300, maxWidth: 560, margin: '16px auto 0', lineHeight: 1.8 }}>
            Vous avez une inquiétude concernant la sécurité ou le bien-être d'un enfant ou d'un
            jeune dans le cadre d'une activité paroissiale ? Ce formulaire est confidentiel et lu
            uniquement par le/la responsable sécurité et l'administrateur de la paroisse. Vous
            pouvez le remplir de manière anonyme.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner" style={{ maxWidth: 640, margin: '0 auto' }}>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
              Qui ou quoi est concerné ? (optionnel)
            </label>
            <input value={concerne} onChange={e => setConcerne(e.target.value)} placeholder="Ex : un enfant du groupe X, un encadrant, une situation…" className="dark-input" />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
              Décrivez votre préoccupation *
            </label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)} rows={6}
              placeholder="Décrivez ce que vous avez observé ou ce qui vous inquiète, avec le plus de détails utiles (dates, lieux…)."
              className="dark-input" style={{ resize: 'vertical' }}
            />
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 20, lineHeight: 1.6 }}>
            Les champs ci-dessous sont facultatifs. Si vous les laissez vides, votre signalement
            sera transmis de manière anonyme.
          </p>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
              Votre nom (optionnel)
            </label>
            <input value={reporterNom} onChange={e => setReporterNom(e.target.value)} placeholder="Laisser vide pour rester anonyme" className="dark-input" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
              Un contact pour vous recontacter (optionnel)
            </label>
            <input value={reporterContact} onChange={e => setReporterContact(e.target.value)} placeholder="Téléphone ou email" className="dark-input" />
          </div>

          {/* Honeypot anti-spam — champ caché, un bot le remplira */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="societe">Ne pas remplir</label>
            <input id="societe" tabIndex={-1} autoComplete="off" value={societe} onChange={e => setSociete(e.target.value)} />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#c62828', marginBottom: 16, marginTop: 8 }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !valide}
            className="btn-gold"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, opacity: (loading || !valide) ? .5 : 1, cursor: (loading || !valide) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Envoi…' : 'Envoyer le signalement'}
          </button>
        </div>
      </div>
    </>
  )
}
