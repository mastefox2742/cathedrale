import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, resetPassword } from '../../services/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/admin')
      } else {
        await resetPassword(email)
        setResetSent(true)
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || ''
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Email ou mot de passe incorrect.')
      } else if (msg.includes('too-many-requests')) {
        setError('Trop de tentatives. Réessayez dans quelques minutes.')
      } else {
        setError(msg || 'Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--primary) 0%, #0d2d7a 60%, #1a1a3e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Motif décoratif */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', top: -40, right: -40,
          fontSize: 320, color: 'rgba(255,255,255,0.03)',
          fontVariationSettings: "'FILL' 1",
        }}>church</span>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', bottom: -60, left: -60,
          fontSize: 280, color: 'rgba(255,255,255,0.03)',
          fontVariationSettings: "'FILL' 1",
        }}>auto_awesome</span>
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '2px solid rgba(254,214,91,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--secondary-container)', fontVariationSettings: "'FILL' 1" }}>church</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'white', marginBottom: 4 }}>
            Cathédrale Sacré-Cœur
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Portail d'Administration</p>
        </div>

        {/* Carte */}
        <div style={{
          background: 'white', borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}>
          {/* Titre du formulaire */}
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
            {mode === 'login' ? 'Connexion' : 'Réinitialiser le mot de passe'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 24 }}>
            {mode === 'login'
              ? 'Accès réservé aux membres autorisés.'
              : 'Entrez votre email pour recevoir un lien de réinitialisation.'}
          </p>

          {/* Message succès reset */}
          {resetSent && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 20,
              background: '#e8f5e9', border: '1px solid #a5d6a7',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#2e7d32', fontSize: 20, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>check_circle</span>
              <p style={{ fontSize: 14, color: '#2e7d32' }}>
                Email envoyé ! Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 18, color: 'var(--on-surface-variant)',
                }}>mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@sacrecoeur-brazza.cg"
                  required
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px',
                    border: '1.5px solid var(--outline-variant)',
                    borderRadius: 10, fontSize: 15, outline: 'none',
                    fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--outline-variant)')}
                />
              </div>
            </div>

            {/* Mot de passe */}
            {mode === 'login' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 18, color: 'var(--on-surface-variant)',
                  }}>lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%', padding: '12px 44px 12px 40px',
                      border: '1.5px solid var(--outline-variant)',
                      borderRadius: 10, fontSize: 15, outline: 'none',
                      fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--outline-variant)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--on-surface-variant)', padding: 2,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: '#ffebee', border: '1px solid #ef9a9a',
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ color: '#c62828', fontSize: 18, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>error</span>
                <p style={{ fontSize: 13, color: '#c62828' }}>{error}</p>
              </div>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>
                : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{mode === 'login' ? 'login' : 'send'}</span>
              }
              {loading ? 'Connexion…' : mode === 'login' ? 'Se connecter' : 'Envoyer le lien'}
            </button>
          </form>

          {/* Lien reset / retour */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(''); setResetSent(false) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--primary)', fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {mode === 'login' ? 'Mot de passe oublié ?' : '← Retour à la connexion'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Archidiocèse de Brazzaville · Accès restreint
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
