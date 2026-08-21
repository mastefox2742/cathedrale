import { useEffect, useState, type FormEvent, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ShieldCheck, LogOut, Calendar, BookOpen, CheckCircle2, Clock3, ChevronRight } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { getMesFormations, type FormationProgress } from '../services/formationProgress'
import { getCours, getModules, type Cours, type Module } from '../services/catechisme'
import { getModulesTermines } from '../services/moduleProgress'

type Mode = 'login' | 'register'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatMemberSince(iso: string | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Relié à Supabase Auth (email/mot de passe). La connexion par téléphone
 * n'est pas encore possible : Supabase exige un fournisseur SMS configuré
 * (Twilio/MessageBird/...) côté projet, ce qui n'a pas été mis en place -
 * on le signale explicitement plutôt que de faire semblant que ça marche.
 */
export function ConnexionPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div style={{ padding: '120px 20px', textAlign: 'center' }}><div className="page-loader-ring" style={{ margin: '0 auto' }} /></div>
  }

  return session ? <ProfilView session={session} /> : <ConnexionForm />
}

function ProfilView({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [mesFormations, setMesFormations] = useState<FormationProgress[]>([])
  const [coursMap, setCoursMap] = useState<Record<string, Cours>>({})
  const [loadingFormations, setLoadingFormations] = useState(true)
  const [prochaineLecon, setProchaineLecon] = useState<{ cours: Cours; module: Module } | null>(null)
  const email = session.user.email ?? ''
  const memberSince = formatMemberSince(session.user.created_at)
  const initial = email.charAt(0).toUpperCase() || '?'

  useEffect(() => {
    Promise.all([getMesFormations(session.user.id), getCours()])
      .then(([progress, cours]) => {
        setMesFormations(progress)
        setCoursMap(Object.fromEntries(cours.filter(c => c.id).map(c => [c.id as string, c])))
      })
      .catch(() => {})
      .finally(() => setLoadingFormations(false))
  }, [session.user.id])

  useEffect(() => {
    const enCours = mesFormations.find(f => f.statut === 'en_cours')
    const cours = enCours ? coursMap[enCours.cours_id] : undefined
    if (!enCours || !cours?.id) { setProchaineLecon(null); return }
    Promise.all([getModules(cours.id), getModulesTermines(session.user.id, cours.id)])
      .then(([modules, termines]) => {
        const suivant = modules.find(m => m.id && !termines.has(m.id))
        setProchaineLecon(suivant ? { cours, module: suivant } : null)
      })
      .catch(() => setProchaineLecon(null))
  }, [mesFormations, coursMap, session.user.id])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    setSigningOut(false)
  }

  return (
    <>
      <div className="page-hero" style={{ paddingBottom: 'var(--space-xl)' }}>
        <div className="page-hero-content" style={{ maxWidth: 480 }}>
          <p className="page-hero-eyebrow">Communauté paroissiale</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>Espace <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Membre</em></h1>
        </div>
      </div>

      <div style={{ padding: '0 var(--pad-x)', marginTop: -56, position: 'relative', zIndex: 3, paddingBottom: 'var(--space-xl)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', background: 'var(--surface)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', padding: 36 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 22, color: 'white' }}>{initial}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 20, color: 'var(--primary)' }}>Bonjour</h2>
              <p style={{ fontSize: 12, color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mail size={16} color="var(--primary)" />
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Adresse email</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{email}</p>
              </div>
            </div>
            {memberSince && (
              <>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Calendar size={16} color="var(--primary)" />
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Membre depuis</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{memberSince}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-mid)', marginTop: 26, marginBottom: 10 }}>Mes formations</p>
          {loadingFormations ? (
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Chargement…</p>
          ) : mesFormations.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 14 }}>
              <BookOpen size={18} color="var(--text-light)" />
              <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Aucune formation commencée pour l'instant.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mesFormations.map(f => {
                const c = coursMap[f.cours_id]
                const termine = f.statut === 'termine'
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 14px' }}>
                    <span style={{ fontSize: 18 }}>{c?.emoji ?? '📘'}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c?.titre ?? 'Formation'}</span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                      padding: '4px 8px', borderRadius: 'var(--r-full)',
                      background: termine ? 'rgba(46,125,91,.1)' : 'rgba(200,155,60,.1)',
                      color: termine ? '#2E7D5B' : 'var(--accent-dark)',
                    }}>
                      {termine ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                      {termine ? 'Terminé' : 'En cours'}
                    </span>
                    {termine && (
                      <a href={`/attestation/${f.cours_id}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textDecoration: 'underline', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        Attestation
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {prochaineLecon && (
            <button
              onClick={() => navigate(`/catechese/${prochaineLecon.cours.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-mid))', border: 'none',
                borderRadius: 'var(--r-md)', padding: 16, marginTop: 22, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 26 }}>{prochaineLecon.module.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)' }}>Prochaine leçon · {prochaineLecon.cours.titre}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prochaineLecon.module.titre}</p>
              </div>
              <ChevronRight size={16} color="white" />
            </button>
          )}

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-mid)', marginTop: 26, marginBottom: 10 }}>Accès rapide</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('/horaires')} style={quickRowStyle}>
              <Clock3 size={17} color="var(--primary)" />
              <span style={{ flex: 1, textAlign: 'left' }}>Horaires des messes</span>
              <ChevronRight size={15} color="var(--text-light)" />
            </button>
            <button onClick={() => navigate('/catechese')} style={quickRowStyle}>
              <BookOpen size={17} color="var(--primary)" />
              <span style={{ flex: 1, textAlign: 'left' }}>Mes formations</span>
              <ChevronRight size={15} color="var(--text-light)" />
            </button>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: '1px solid #B54747', color: '#B54747', background: 'none', borderRadius: 'var(--r-sm)',
              padding: '12px 0', marginTop: 24, cursor: signingOut ? 'default' : 'pointer', opacity: signingOut ? .7 : 1,
              fontFamily: 'var(--v2-font-sans)', fontSize: 13, fontWeight: 700,
            }}
          >
            <LogOut size={15} /> {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </div>
    </>
  )
}

const quickRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
  padding: '12px 14px', cursor: 'pointer', fontFamily: 'var(--v2-font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text)',
}

function ConnexionForm() {
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
      setError("La connexion par téléphone n'est pas encore disponible — merci d'utiliser une adresse email pour le moment.")
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: identifier, password })
        if (authError) throw authError
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email: identifier, password })
        if (authError) throw authError
        if (!data.session) {
          setNotice('Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.')
          setMode('login')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-hero" style={{ paddingBottom: 'var(--space-xl)' }}>
        <div className="page-hero-content" style={{ maxWidth: 480 }}>
          <p className="page-hero-eyebrow">Communauté paroissiale</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>Espace <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Membre</em></h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 14, lineHeight: 1.8, maxWidth: 420 }}>
            Connectez-vous pour suivre votre parcours, rejoindre un groupe de prière ou suivre le catéchisme de vos enfants.
          </p>
        </div>
      </div>

      <div style={{ padding: '0 var(--pad-x)', marginTop: -56, position: 'relative', zIndex: 3, paddingBottom: 'var(--space-xl)' }}>
        <div style={{ maxWidth: 440, margin: '0 auto', background: 'var(--surface)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', padding: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={20} color="var(--accent-light)" />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.5 }}>
              Vos données sont strictement réservées aux activités pastorales.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--v2-font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                color: mode === 'login' ? 'var(--primary)' : 'var(--text-light)',
                borderBottom: mode === 'login' ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--v2-font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                color: mode === 'register' ? 'var(--primary)' : 'var(--text-light)',
                borderBottom: mode === 'register' ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="identifier" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 8 }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-light)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input
                  id="identifier"
                  type="text"
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  placeholder="ex: prenom.nom@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="dark-input"
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label htmlFor="password" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>
                  Mot de passe
                </label>
                {mode === 'login' && (
                  <a href="#" style={{ fontSize: 11, color: 'var(--blue)', textDecoration: 'none' }}>Oublié ?</a>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-light)" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  className="dark-input"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#C0392B', background: 'rgba(220,53,69,.08)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>{error}</p>
            )}
            {notice && (
              <p style={{ fontSize: 12, color: 'var(--blue)', background: 'var(--secondary, rgba(74,127,181,.08))', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>{notice}</p>
            )}

            <button type="submit" disabled={submitting} className="btn-gold" style={{ justifyContent: 'center', marginTop: 8, opacity: submitting ? .7 : 1 }}>
              {submitting ? 'Veuillez patienter…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'var(--text-light)', textAlign: 'center', marginTop: 24 }}>
            <button type="button" onClick={() => navigate('/horaires')} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 11, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
              Consulter les horaires publics sans compte
            </button>
          </p>
        </div>
      </div>
    </>
  )
}
