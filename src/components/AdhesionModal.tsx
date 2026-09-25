'use client'

import { useState } from 'react'
import { demanderAdhesion } from '../services/adhesions'
import type { Groupe } from '../services/groupes'

/** Formulaire d'adhésion à un groupe (prière, mouvement, jeunesse…). */
export function AdhesionModal({ groupe, onClose }: { groupe: Groupe; onClose: () => void }) {
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [societe, setSociete] = useState('') // honeypot
  const [envoi, setEnvoi] = useState(false)
  const [etat, setEtat] = useState<'form' | 'ok' | 'erreur'>('form')

  const valide = nom.trim().length >= 2 && contact.trim().length >= 5

  async function envoyer() {
    if (societe || !valide || !groupe.id) return
    setEnvoi(true)
    try {
      await demanderAdhesion(groupe.id, groupe.parishId, { nom, contact, message })
      setEtat('ok')
    } catch {
      setEtat('erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(30,58,95,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="adhesion-titre" style={{
        background: 'var(--surface)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)',
        width: '100%', maxWidth: 460, padding: 28, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <span className="section-label">Rejoindre un groupe</span>
        <h2 id="adhesion-titre" style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          {groupe.icon} {groupe.titre}
        </h2>
        {groupe.horaire && <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 18 }}>{groupe.horaire}</p>}

        {etat === 'ok' ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7, margin: '12px 0 20px' }}>
              Merci ! Votre demande a été transmise au responsable du groupe, qui vous recontactera.
            </p>
            <button onClick={onClose} className="btn-gold" style={{ width: '100%', justifyContent: 'center' }}>Fermer</button>
          </>
        ) : (
          <>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom et prénom" className="dark-input" style={{ width: '100%', marginBottom: 12 }} />
            <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Téléphone ou email" className="dark-input" style={{ width: '100%', marginBottom: 12 }} />
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Un mot pour le responsable (facultatif)" className="dark-input" style={{ width: '100%', resize: 'vertical', marginBottom: 12 }} />
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="societe-adhesion">Ne pas remplir</label>
              <input id="societe-adhesion" tabIndex={-1} autoComplete="off" value={societe} onChange={e => setSociete(e.target.value)} />
            </div>
            {etat === 'erreur' && <p style={{ fontSize: 12, color: '#C62828', marginBottom: 12 }}>Une erreur est survenue. Merci de réessayer.</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
              <button onClick={envoyer} disabled={!valide || envoi} className="btn-gold" style={{ flex: 1, justifyContent: 'center', opacity: valide && !envoi ? 1 : .5 }}>
                {envoi ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
