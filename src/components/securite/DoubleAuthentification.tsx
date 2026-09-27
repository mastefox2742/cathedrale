'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../services/supabase'

/**
 * Double authentification (TOTP, Supabase Auth MFA).
 *
 * - Aucun facteur vérifié : enrôlement (QR code à scanner avec Google
 *   Authenticator, Microsoft Authenticator, Authy…), puis premier code.
 * - Un facteur existe : demande du code à 6 chiffres.
 * Dans les deux cas, la session passe au niveau « aal2 » après validation.
 */

type Etape = 'chargement' | 'enrolement' | 'code' | 'erreur'

const inputStyle = {
  width: '100%', padding: '12px 14px', fontSize: 22, letterSpacing: '.4em', textAlign: 'center' as const,
  border: '1.5px solid var(--outline-variant, #c5c5d3)', borderRadius: 10, fontFamily: 'monospace',
}

export function DoubleAuthentification({ onSucces, texteBouton = 'Valider' }: { onSucces: () => void; texteBouton?: string }) {
  const [etape, setEtape] = useState<Etape>('chargement')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let annule = false
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (annule) return
      if (error) { setErreur('Impossible de lire vos facteurs d\'authentification.'); setEtape('erreur'); return }
      const verifie = data.totp.find(f => f.status === 'verified')
      if (verifie) { setFactorId(verifie.id); setEtape('code'); return }
      // Enrôlements commencés mais jamais validés : on repart de zéro.
      for (const f of data.all.filter(f => f.factor_type === 'totp' && f.status !== 'verified')) {
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
      const { data: e, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Application ${new Date().toISOString().slice(0, 10)}` })
      if (annule) return
      if (err || !e) { setErreur('La double authentification n\'a pas pu être initialisée.'); setEtape('erreur'); return }
      setFactorId(e.id)
      setQr(e.totp.qr_code)
      setSecret(e.totp.secret)
      setEtape('enrolement')
    })()
    return () => { annule = true }
  }, [])

  async function valider(ev: FormEvent) {
    ev.preventDefault()
    if (!factorId || !/^\d{6}$/.test(code)) { setErreur('Saisissez les 6 chiffres affichés par votre application.'); return }
    setEnvoi(true)
    setErreur(null)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    setEnvoi(false)
    if (error) { setErreur('Code incorrect ou expiré. Réessayez avec le code affiché maintenant.'); setCode(''); return }
    onSucces()
  }

  if (etape === 'chargement') return <p style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>Préparation…</p>
  if (etape === 'erreur') return <p style={{ fontSize: 13, color: '#c62828' }}>{erreur}</p>

  return (
    <form onSubmit={valider} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {etape === 'enrolement' ? (
        <>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#333' }}>
            <strong>1.</strong> Installez une application d'authentification (Google Authenticator, Microsoft Authenticator, Authy…).<br />
            <strong>2.</strong> Scannez ce QR code avec l'application.<br />
            <strong>3.</strong> Saisissez le code à 6 chiffres qu'elle affiche.
          </p>
          {qr && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img src={qr} alt="QR code de double authentification" width={180} height={180} style={{ background: '#fff', padding: 8, borderRadius: 8 }} />
            </div>
          )}
          {secret && (
            <p style={{ fontSize: 11, color: '#555', textAlign: 'center', wordBreak: 'break-all' }}>
              Sans appareil photo, saisissez cette clé : <code style={{ fontWeight: 700 }}>{secret}</code>
            </p>
          )}
        </>
      ) : (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#333' }}>
          Ouvrez votre application d'authentification et saisissez le code à 6 chiffres.
        </p>
      )}
      <input
        value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label="Code à 6 chiffres"
        autoFocus style={inputStyle}
      />
      {erreur && <p style={{ fontSize: 12, color: '#c62828' }}>{erreur}</p>}
      <button type="submit" disabled={envoi} className="btn-primary" style={{ justifyContent: 'center', opacity: envoi ? .7 : 1 }}>
        {envoi ? 'Vérification…' : texteBouton}
      </button>
    </form>
  )
}
