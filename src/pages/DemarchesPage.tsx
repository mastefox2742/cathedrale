import { useState } from 'react'
import { Link } from 'react-router-dom'
import { creerDemande, TYPE_DEMANDE_LABELS, type TypeDemande } from '../services/demandesPastorales'

export function DemarchesPage() {
  const [type, setType] = useState<TypeDemande>('info_generale')
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [societe, setSociete] = useState('') // champ honeypot — invisible pour un humain
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')

  const valide = nom.trim().length > 1 && contact.trim().length > 3 && message.trim().length > 5

  async function handleSubmit() {
    if (societe) return // honeypot rempli → soumission ignorée silencieusement
    if (!valide) return setError('Merci de renseigner votre nom, un contact et votre message.')
    setError('')
    setLoading(true)
    try {
      const ref = await creerDemande({ type, nom: nom.trim(), contact: contact.trim(), message: message.trim() })
      setReference(ref)
    } catch {
      setError("Une erreur est survenue. Merci de réessayer dans un instant.")
    } finally {
      setLoading(false)
    }
  }

  if (reference) {
    return (
      <div className="page-hero" style={{ paddingBottom: 0 }}>
        <div className="inner" style={{ position: 'relative', zIndex: 2, paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✝️</div>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 24, color: 'var(--primary)', marginBottom: 4 }}>
              Demande envoyée
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
              Nous avons bien reçu votre demande « {TYPE_DEMANDE_LABELS[type]} ».
            </p>
            <div style={{
              background: 'rgba(56,142,60,.08)', border: '1px solid rgba(56,142,60,.3)',
              borderRadius: 'var(--r-md)', padding: '16px', marginBottom: 24,
            }}>
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>Votre référence de suivi</p>
              <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 20, fontWeight: 700, color: '#388E3C' }}>{reference}</p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 24, lineHeight: 1.6 }}>
              Un membre de la paroisse vous recontactera au contact indiqué. Conservez cette référence pour tout suivi.
            </p>
            <Link to="/horaires" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              Retour aux informations pratiques
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
          <p className="page-hero-eyebrow" style={{ justifyContent: 'center' }}>Démarches pastorales</p>
          <h1>Faire une <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>demande</em></h1>
          <p style={{ marginTop: 16, fontSize: 15, color: 'var(--text-mid)', fontWeight: 300, maxWidth: 500, margin: '16px auto 0', lineHeight: 1.8 }}>
            Baptême, mariage, obsèques, certificat, accompagnement… Choisissez votre demande et nous vous recontacterons.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner" style={{ maxWidth: 640, margin: '0 auto' }}>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
              Type de demande
            </label>
            <select value={type} onChange={e => setType(e.target.value as TypeDemande)} className="dark-input">
              {(Object.entries(TYPE_DEMANDE_LABELS) as [TypeDemande, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
              Votre nom
            </label>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom et prénom" className="dark-input" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
              Contact (téléphone ou email)
            </label>
            <input value={contact} onChange={e => setContact(e.target.value)} placeholder="+242 06 000 00 00" className="dark-input" />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
              Votre message
            </label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)} rows={5}
              placeholder="Décrivez votre demande (dates souhaitées, précisions utiles…)"
              className="dark-input" style={{ resize: 'vertical' }}
            />
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
            style={{ width: '100%', justifyContent: 'center', marginTop: 16, opacity: (loading || !valide) ? .5 : 1, cursor: (loading || !valide) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Envoi…' : 'Envoyer ma demande'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-light)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            Vos informations sont utilisées uniquement pour traiter votre demande pastorale.
          </p>
        </div>
      </div>
    </>
  )
}
