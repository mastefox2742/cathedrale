'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Lock } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { DoubleAuthentification } from './DoubleAuthentification'

/** Espace membre : activer ou retirer la double authentification (facultative pour les fidèles). */
export function SecuriteCompte({ titreStyle, ligneStyle }: { titreStyle: CSSProperties; ligneStyle: CSSProperties }) {
  const [facteur, setFacteur] = useState<string | null | undefined>(undefined)
  const [activation, setActivation] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function charger() {
    const { data } = await supabase.auth.mfa.listFactors()
    setFacteur(data?.totp.find(f => f.status === 'verified')?.id ?? null)
  }
  useEffect(() => { charger() }, [])

  async function retirer() {
    if (!facteur || !confirm('Retirer la double authentification de votre compte ?')) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId: facteur })
    setMessage(error ? 'Pour la retirer, reconnectez-vous en saisissant votre code, puis réessayez.' : 'Double authentification retirée.')
    charger()
  }

  if (facteur === undefined) return null
  return (
    <>
      <p style={titreStyle}><Lock size={13} /> Sécurité du compte</p>
      {activation ? (
        <div style={{ ...ligneStyle, display: 'block' }}>
          <DoubleAuthentification texteBouton="Activer" onSucces={() => { setActivation(false); setMessage('Double authentification activée : un code vous sera demandé à chaque connexion.'); charger() }} />
        </div>
      ) : (
        <div style={ligneStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600 }}>Double authentification {facteur ? 'activée' : 'désactivée'}</p>
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
              {facteur ? 'Un code de votre application vous est demandé à la connexion.' : 'Recommandée : protège votre compte même si votre mot de passe est découvert.'}
            </p>
          </div>
          {facteur
            ? <button onClick={retirer} style={{ background: 'none', border: 'none', color: '#c62828', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Retirer</button>
            : <button onClick={() => setActivation(true)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Activer</button>}
        </div>
      )}
      {message && <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 8 }}>{message}</p>}
    </>
  )
}
