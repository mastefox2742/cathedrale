import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Award, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getParcoursBySlug, getEtapes, getEtapesTerminees, terminerEtape, youtubeEmbed,
  TYPE_PARCOURS, APPEL_ACTION, type Parcours, type Etape,
} from '../services/parcours'
import { Markdown } from '../components/Markdown'
import { Quiz } from '../components/Quiz'

export function ParcoursPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [parcours, setParcours] = useState<Parcours | null>(null)
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [terminees, setTerminees] = useState<Map<string, string>>(new Map())
  const [active, setActive] = useState(0)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    getParcoursBySlug(slug)
      .then(async p => {
        setParcours(p)
        if (p) setEtapes(await getEtapes(p.id))
      })
      .catch(() => setParcours(null))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!user || !parcours || etapes.length === 0) return
    getEtapesTerminees(user.id, parcours.id).then(t => {
      setTerminees(t)
      // Reprendre à la première étape non terminée.
      const idx = etapes.findIndex(x => !t.has(x.id))
      setActive(idx === -1 ? 0 : idx)
    }).catch(() => {})
  }, [user, parcours, etapes])

  if (loading) return <div style={{ padding: '120px 20px', textAlign: 'center' }}><div className="page-loader-ring" style={{ margin: '0 auto' }} /></div>

  if (!parcours) {
    return (
      <div style={{ padding: '140px 20px 80px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: 'var(--text-light)', marginBottom: 20 }}>Ce parcours est introuvable.</p>
        <Link to="/decouvrir-la-foi" className="btn-gold">Voir les parcours</Link>
      </div>
    )
  }

  const etape = etapes[active]
  const embed = youtubeEmbed(etape?.videoUrl ?? null)
  const faites = etapes.filter(e => terminees.has(e.id)).length
  const complet = etapes.length > 0 && faites >= etapes.length
  const retour = TYPE_PARCOURS[parcours.type].route
  const appel = etape ? APPEL_ACTION[etape.appelAction] : null
  const quizOk = !etape || etape.quiz.length === 0 || quizScore !== null

  async function valider(score?: number) {
    if (!etape) return
    if (user) {
      try {
        await terminerEtape(user.id, etape, score)
        setTerminees(t => new Map(t).set(etape.id, new Date().toISOString()))
      } catch { /* la progression sera réessayée à la prochaine étape */ }
    }
    setQuizScore(null)
    if (active + 1 < etapes.length) {
      setActive(active + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">{TYPE_PARCOURS[parcours.type].label}</p>
          <h1>{parcours.emoji} <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>{parcours.titre}</em></h1>
        </div>
      </div>

      <div style={{ padding: 'var(--space-lg) 0 var(--space-xl)' }}>
        <div className="inner">
          <Link to={retour} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)', textDecoration: 'none', marginBottom: 24 }}>
            <ArrowLeft size={14} /> Tous les parcours
          </Link>

          {!user && (
            <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--bg-alt)', border: '1px solid var(--border-accent)', marginBottom: 24, flexWrap: 'wrap' }}>
              <Lock size={16} color="var(--primary)" />
              <p style={{ fontSize: 13, color: 'var(--text-mid)', flex: 1, minWidth: 200 }}>
                Vous pouvez lire librement. <strong>Connectez-vous</strong> pour enregistrer votre progression et obtenir une attestation.
              </p>
              <Link to="/connexion" className="btn-outline" style={{ fontSize: 10 }}>Espace Membre</Link>
            </div>
          )}

          <div className="parcours-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 'clamp(20px,4vw,48px)', alignItems: 'start' }}>
            {/* ── Étapes ── */}
            <aside style={{ position: 'sticky', top: 90 }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 12 }}>
                {parcours.type === 'neuvaine' ? 'Jours' : 'Étapes'} · {faites}/{etapes.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {etapes.map((e, i) => {
                  const fait = terminees.has(e.id)
                  return (
                    <button key={e.id} onClick={() => { setActive(i); setQuizScore(null) }} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                      background: i === active ? 'var(--primary)' : 'var(--surface)',
                      color: i === active ? '#fff' : 'var(--text)',
                      border: '1px solid var(--border)', fontSize: 13, fontWeight: i === active ? 600 : 400,
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        background: fait ? '#388E3C' : 'transparent', color: fait ? '#fff' : 'inherit',
                        border: fait ? 'none' : '1.5px solid currentColor',
                      }}>{fait ? <Check size={12} /> : i + 1}</span>
                      {e.titre}
                    </button>
                  )
                })}
              </div>
              {complet && (
                <Link to={`/parcours/${parcours.slug}/attestation`} className="btn-gold" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                  <Award size={15} /> Mon attestation
                </Link>
              )}
            </aside>

            {/* ── Contenu de l'étape ── */}
            <article style={{ minWidth: 0 }}>
              {!etape ? (
                <p style={{ color: 'var(--text-light)' }}>Ce parcours ne contient pas encore d'étape.</p>
              ) : (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 8 }}>
                    {parcours.type === 'neuvaine' ? 'Jour' : 'Étape'} {active + 1} / {etapes.length}
                  </p>
                  <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,34px)', fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>{etape.titre}</h2>

                  {embed && (
                    <div style={{ aspectRatio: '16/9', marginBottom: 24 }}>
                      <iframe src={embed} title={etape.titre} style={{ width: '100%', height: '100%', border: 'none' }} allow="encrypted-media; picture-in-picture" allowFullScreen />
                    </div>
                  )}

                  <Markdown text={etape.contenu} />

                  {etape.quiz.length > 0 && quizScore === null && (
                    <Quiz key={etape.id} questions={etape.quiz} onFinish={setQuizScore} />
                  )}
                  {etape.quiz.length > 0 && quizScore !== null && (
                    <div style={{ textAlign: 'center', padding: '24px 20px', background: 'var(--bg-alt)', borderRadius: 'var(--r-md)', marginTop: 28 }}>
                      <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 20, color: 'var(--primary)' }}>{quizScore}/{etape.quiz.length} bonnes réponses</p>
                      <button onClick={() => setQuizScore(null)} className="btn-outline" style={{ marginTop: 14, fontSize: 10 }}>Refaire le quiz</button>
                    </div>
                  )}

                  {appel?.to && (
                    <div style={{ marginTop: 28, padding: '20px 22px', border: '1px solid var(--border-accent)', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 14, color: 'var(--text)', flex: 1, minWidth: 200, fontFamily: 'var(--v2-font-serif)' }}>Et maintenant ?</p>
                      <Link to={appel.to} className="btn-gold" style={{ fontSize: 10 }}>{appel.label}</Link>
                    </div>
                  )}

                  <button
                    onClick={() => valider(quizScore ?? undefined)}
                    disabled={!quizOk}
                    className="btn-gold"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 28, opacity: quizOk ? 1 : .5, cursor: quizOk ? 'pointer' : 'not-allowed' }}
                  >
                    {active + 1 < etapes.length
                      ? (terminees.has(etape.id) ? 'Étape suivante →' : 'J\'ai terminé cette étape →')
                      : (complet ? 'Parcours terminé ✓' : 'Terminer le parcours ✓')}
                  </button>
                  {complet && active + 1 >= etapes.length && (
                    <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-mid)' }}>
                      Bravo ! Vous avez terminé ce parcours. <Link to={`/parcours/${parcours.slug}/attestation`} style={{ color: 'var(--blue)', fontWeight: 700 }}>Obtenir mon attestation</Link>
                    </p>
                  )}
                </>
              )}
            </article>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .parcours-layout { grid-template-columns: 1fr !important; }
          .parcours-layout aside { position: static !important; }
        }
      `}</style>
    </>
  )
}
