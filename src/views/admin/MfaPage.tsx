'use client'

import { useSearchParams } from '../../lib/navigation'
import { DoubleAuthentification } from '../../components/securite/DoubleAuthentification'
import { supabase } from '../../services/supabase'

/** Étape obligatoire pour tout compte d'administration : double authentification. */
export function MfaPage() {
  const [params] = useSearchParams()
  const suite = params.get('suite')
  const destination = suite && suite.startsWith('/admin') && !suite.startsWith('//') && suite !== '/admin/mfa' ? suite : '/admin'

  async function annuler() {
    await supabase.auth.signOut()
    window.location.assign('/admin/login')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
      background: 'linear-gradient(135deg, var(--primary) 0%, #0d2d7a 60%, #1a1a3e 100%)', fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24, color: '#fff' }}>
          <img src="/logo.png" alt="" width={64} height={64} style={{ borderRadius: '50%', marginBottom: 12 }} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22 }}>Double authentification</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
            Obligatoire pour accéder à l'administration
          </p>
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
          {/* Rechargement complet : le middleware relit la session, désormais au niveau aal2. */}
          <DoubleAuthentification onSucces={() => window.location.assign(destination)} texteBouton="Accéder à l'administration" />
          <button type="button" onClick={annuler} style={{ marginTop: 16, width: '100%', background: 'none', border: 'none', color: '#666', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
