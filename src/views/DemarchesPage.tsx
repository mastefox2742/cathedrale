'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from '../lib/navigation'
import {
  creerDemande, suivreDemande, TYPE_DEMANDE_LABELS, STATUT_DEMANDE_LABELS, CHAMPS_DEMARCHE,
  type TypeDemande, type SuiviDemande,
} from '../services/demandesPastorales'

export function DemarchesPage() {
  const [params] = useSearchParams()
  const typeParam = params.get('type') as TypeDemande | null
  const [type, setType] = useState<TypeDemande>(typeParam && typeParam in TYPE_DEMANDE_LABELS ? typeParam : 'info_generale')
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [societe, setSociete] = useState('') // champ honeypot — invisible pour un humain
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [details, setDetails] = useState<Record<string, string>>({})
  // Suivi d'une demande sans compte (référence + contact)
  const [suiviRef, setSuiviRef] = useState('')
  const [suiviContact, setSuiviContact] = useState('')
  const [suivi, setSuivi] = useState<SuiviDemande | null | 'introuvable'>(null)
  const [suiviEnCours, setSuiviEnCours] = useState(false)

  const champs = CHAMPS_DEMARCHE[type] ?? []

  async function rechercherSuivi() {
    if (!suiviRef.trim() || !suiviContact.trim()) return
    setSuiviEnCours(true)
    try { setSuivi((await suivreDemande(suiviRef, suiviContact)) ?? 'introuvable') }
    catch { setSuivi('introuvable') }
    finally { setSuiviEnCours(false) }
  }

  const valide = nom.trim().length > 1 && contact.trim().length > 3 && message.trim().length > 5

  async function handleSubmit() {
    if (societe) return // honeypot rempli → soumission ignorée silencieusement
    if (!valide) return setError('Merci de renseigner votre nom, un contact et votre message.')
    setError('')
    setLoading(true)
    try {
      const remplis = Object.fromEntries(
        champs.map(c => [c.cle, (details[c.cle] ?? '').trim()]).filter(([, v]) => v),
      )
      const ref = await creerDemande({ type, nom: nom.trim(), contact: contact.trim(), message: message.trim(), details: remplis })
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
              Un membre de la paroisse vous recontactera au contact indiqué. Conservez cette référence : elle permet de suivre votre demande sur cette page, avec votre contact.
            </p>
            <Link href="/horaires" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
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
            <select value={type} onChange={e => { setType(e.target.value as TypeDemande); setDetails({}) }} className="dark-input">
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

          {champs.length > 0 && (
            <fieldset style={{ border: '1px solid var(--border-accent)', padding: '18px 18px 4px', marginBottom: 20 }}>
              <legend style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-dark)', padding: '0 6px' }}>
                {TYPE_DEMANDE_LABELS[type]} — informations utiles
              </legend>
              {champs.map(c => (
                <div key={c.cle} style={{ marginBottom: 14 }}>
                  <label htmlFor={`champ-${c.cle}`} style={{ fontSize: 12, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>{c.label}</label>
                  <input id={`champ-${c.cle}`} type={c.type ?? 'text'} value={details[c.cle] ?? ''}
                    onChange={e => setDetails(d => ({ ...d, [c.cle]: e.target.value }))} className="dark-input" />
                </div>
              ))}
            </fieldset>
          )}

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

          {/* ══ SUIVI D'UNE DEMANDE ══ */}
          <div id="suivi" style={{ marginTop: 'var(--space-xl)', background: 'var(--bg-alt)', border: '1px solid var(--border-accent)', padding: 24 }}>
            <span className="section-label">Suivre ma demande</span>
            <p style={{ fontSize: 13, color: 'var(--text-light)', margin: '8px 0 16px', lineHeight: 1.6 }}>
              Saisissez la référence reçue et le contact indiqué lors de votre demande. Connecté à votre Espace Membre, vous retrouvez aussi vos demandes dans votre profil.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
              <input value={suiviRef} onChange={e => setSuiviRef(e.target.value)} placeholder="Référence (SC-…)" className="dark-input" aria-label="Référence de la demande" />
              <input value={suiviContact} onChange={e => setSuiviContact(e.target.value)} placeholder="Téléphone ou email" className="dark-input" aria-label="Contact indiqué" />
            </div>
            <button onClick={rechercherSuivi} disabled={suiviEnCours || !suiviRef.trim() || !suiviContact.trim()} className="btn-outline" style={{ fontSize: 10 }}>
              {suiviEnCours ? 'Recherche…' : 'Voir le statut'}
            </button>
            {suivi === 'introuvable' && <p style={{ fontSize: 13, color: '#c62828', marginTop: 12 }}>Aucune demande ne correspond à cette référence et ce contact.</p>}
            {suivi && suivi !== 'introuvable' && (
              <p style={{ fontSize: 14, color: 'var(--text)', marginTop: 12 }}>
                {TYPE_DEMANDE_LABELS[suivi.type]} : <strong style={{ color: 'var(--primary)' }}>{STATUT_DEMANDE_LABELS[suivi.statut]}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}> · reçue le {new Date(suivi.createdAt).toLocaleDateString('fr-FR')}, mise à jour le {new Date(suivi.updatedAt).toLocaleDateString('fr-FR')}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
