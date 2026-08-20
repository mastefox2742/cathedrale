import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconX, IconShieldCheck, IconEnvelope, IconLockKey, IconEye, IconEyeSlash, IconPhone, IconLock, IconGoogle,
} from '../components/ui/icons'
import { supabase } from '../services/supabase'

type Mode = 'login' | 'register'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Écran d'authentification "Espace Membre" (design fourni par l'utilisateur,
 * authentication-screen.html). Traduction fidèle du mockup en composant React
 * fonctionnel — bascule Connexion/Inscription, affichage du mot de passe,
 * état de formulaire.
 *
 * Relié à Supabase Auth (email/mot de passe). La connexion par téléphone
 * n'est pas encore possible : Supabase exige un fournisseur SMS configuré
 * (Twilio/MessageBird/...) côté projet, ce qui n'a pas été mis en place -
 * on le signale explicitement plutôt que de faire semblant que ça marche.
 */
export function ConnexionPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!EMAIL_RE.test(identifier)) {
      setError(
        'La connexion par téléphone n\'est pas encore disponible — merci d\'utiliser une adresse email pour le moment.',
      )
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        })
        if (authError) throw authError
        navigate('/')
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: identifier,
          password,
        })
        if (authError) throw authError
        if (!data.session) {
          // Confirmation email activée côté projet Supabase (comportement par
          // défaut) : le compte existe mais aucune session tant que le lien
          // reçu par email n'est pas cliqué.
          setNotice('Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.')
          setMode('login')
        } else {
          navigate('/')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-theme">
      <main className="min-h-screen bg-background text-foreground px-5 pt-8 pb-10 flex flex-col justify-between max-w-md mx-auto">
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Fermer"
              className="size-10 rounded-full bg-card border border-border flex items-center justify-center"
            >
              <IconX className="text-primary" size={20} />
            </button>
            <span className="text-xs font-semibold text-muted-foreground">Espace Membre</span>
          </div>

          <div className="mb-6">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center mb-3">
              <IconShieldCheck className="text-accent" size={24} />
            </div>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Connexion à votre espace paroissial
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Connectez-vous pour suivre votre parcours, rejoindre un groupe de prière ou suivre le
              catéchisme de vos enfants.
            </p>
          </div>

          <div className="grid grid-cols-2 bg-muted p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'font-semibold text-muted-foreground'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                mode === 'register' ? 'bg-card text-foreground shadow-sm' : 'font-semibold text-muted-foreground'
              }`}
            >
              Créer un compte
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-foreground mb-1.5">
                Adresse email ou Téléphone
              </label>
              <div className="relative">
                <IconEnvelope className="absolute left-3.5 top-3.5 text-muted-foreground" size={16} />
                <input
                  id="identifier"
                  type="text"
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  placeholder="ex: miche.dev@paroisse.ci"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-foreground">
                  Mot de passe
                </label>
                {mode === 'login' ? (
                  <a href="#" className="text-xs font-semibold text-accent">
                    Oublié ?
                  </a>
                ) : null}
              </div>
              <div className="relative">
                <IconLockKey className="absolute left-3.5 top-3.5 text-muted-foreground" size={16} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  className="w-full pl-10 pr-10 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3.5 top-3.5 text-muted-foreground cursor-pointer"
                >
                  {showPassword ? <IconEye size={16} /> : <IconEyeSlash size={16} />}
                </button>
              </div>
            </div>

            {error ? (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            ) : null}
            {notice ? (
              <p className="text-xs text-secondary-foreground bg-secondary rounded-lg px-3 py-2">{notice}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow mt-2 disabled:opacity-60"
            >
              {submitting ? 'Veuillez patienter…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-background px-3 text-[11px] font-semibold text-muted-foreground uppercase">
              Ou continuer avec
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="py-2.5 px-4 bg-card border border-border rounded-xl flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <IconGoogle size={16} />
              Google
            </button>
            <button
              type="button"
              className="py-2.5 px-4 bg-card border border-border rounded-xl flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <IconPhone className="text-primary" size={16} />
              SMS / WhatsApp
            </button>
          </div>
        </div>

        <div className="pt-6 text-center">
          <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center justify-center gap-1">
            <IconLock className="shrink-0" size={14} style={{ color: '#2E7D5B' }} />
            Vos données sont strictement réservées aux activités pastorales et sécurisées.
          </p>
          <button
            type="button"
            onClick={() => navigate('/horaires')}
            className="text-[11px] font-semibold text-primary underline mt-1 block mx-auto"
          >
            Consulter les horaires publics sans compte
          </button>
        </div>
      </main>
    </div>
  )
}
