import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, GraduationCap } from 'lucide-react'
import { Quiz } from '../components/Quiz'
import { Markdown } from '../components/Markdown'
import {
  getCoursById, getModules, getLecons,
  type Cours, type Module, type Lecon,
} from '../services/catechisme'
import { supabase } from '../services/supabase'
import { demarrerFormation, terminerFormation } from '../services/formationProgress'
import { getModulesTermines, marquerModuleTermine } from '../services/moduleProgress'

// ── Résultat quiz ─────────────────────────────────────────────────────────────
function QuizResultat({ score, total, continueLabel, onRetry, onContinue }: {
  score: number; total: number; continueLabel: string; onRetry: () => void; onContinue: () => void
}) {
  const pct = Math.round((score / total) * 100)
  const msg = pct === 100 ? 'Parfait ! Tu as tout bon !' : pct >= 80 ? 'Très bien ! Tu maîtrises ce module.' : pct >= 60 ? 'Bien ! Tu peux encore réviser.' : 'Continue, tu vas y arriver !'

  return (
    <div style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-alt)', borderRadius: 'var(--r-md)', marginTop: 28 }}>
      <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 24, color: 'var(--primary)', marginBottom: 8 }}>
        {score}/{total} bonnes réponses
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 22 }}>{msg}</p>
      <div style={{ background: 'rgba(30,58,95,.1)', borderRadius: 8, height: 10, margin: '0 auto 22px', maxWidth: 240 }}>
        <div style={{
          height: '100%', borderRadius: 8,
          background: pct >= 80 ? '#388E3C' : pct >= 60 ? '#F57F17' : '#C62828',
          width: `${pct}%`, transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={onRetry} className="btn-outline">Réessayer</button>
        {pct >= 60 && (
          <button onClick={onContinue} className="btn-gold">{continueLabel}</button>
        )}
      </div>
    </div>
  )
}

function isEmbeddableVideo(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url)
}
function toEmbedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url
}

// ── Contenu d'une leçon selon son type ─────────────────────────────────────────
function LeconContent({ lecon }: { lecon: Lecon }) {
  switch (lecon.type) {
    case 'texte':
    case 'activite':
      return <Markdown text={lecon.contenu ?? ''} />
    case 'video':
      return lecon.url ? (
        isEmbeddableVideo(lecon.url) ? (
          <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <iframe
              src={toEmbedUrl(lecon.url)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video controls src={lecon.url} style={{ width: '100%', borderRadius: 'var(--r-md)' }} />
        )
      ) : <p style={{ color: 'var(--text-light)' }}>Aucune vidéo renseignée.</p>
    case 'audio':
      return lecon.url ? (
        <audio controls src={lecon.url} style={{ width: '100%' }} />
      ) : <p style={{ color: 'var(--text-light)' }}>Aucun audio renseigné.</p>
    case 'document':
      return lecon.url ? (
        <a href={lecon.url} target="_blank" rel="noreferrer" className="btn-outline" style={{ display: 'inline-flex' }}>
          📄 Ouvrir le document ↗
        </a>
      ) : <p style={{ color: 'var(--text-light)' }}>Aucun document renseigné.</p>
    default:
      return null
  }
}

// ── Page principale ───────────────────────────────────────────────────────────
export function CoursPage() {
  const { coursId } = useParams<{ coursId: string }>()
  const navigate = useNavigate()
  const [cours, setCours] = useState<Cours | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState(0)
  const [lecons, setLecons] = useState<Lecon[]>([])
  const [loadingLecons, setLoadingLecons] = useState(false)
  const [activeLecon, setActiveLecon] = useState(0)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [progress, setProgress] = useState<Record<number, boolean>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [startedSynced, setStartedSynced] = useState(false)
  const [completedSynced, setCompletedSynced] = useState(false)
  const [horsLigne, setHorsLigne] = useState(false)
  const [telechargement, setTelechargement] = useState(false)

  useEffect(() => {
    if (coursId) setHorsLigne(localStorage.getItem(`hors-ligne-${coursId}`) === '1')
  }, [coursId])

  async function telechargerHorsLigne() {
    if (!coursId) return
    setTelechargement(true)
    try {
      const [, mods] = await Promise.all([getCoursById(coursId), getModules(coursId)])
      await Promise.all(mods.map(m => getLecons(m.id!)))
      localStorage.setItem(`hors-ligne-${coursId}`, '1')
      setHorsLigne(true)
    } catch {
      // Le téléchargement échoue silencieusement si hors ligne — l'utilisateur reste informé par le bouton inchangé.
    } finally {
      setTelechargement(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null))
  }, [])

  useEffect(() => {
    if (!coursId) return
    Promise.all([getCoursById(coursId), getModules(coursId)])
      .then(([c, m]) => {
        setCours(c)
        setModules(m)
      })
      .catch(() => setCours(null))
      .finally(() => setLoading(false))
  }, [coursId])

  useEffect(() => {
    const mod = modules[activeModule]
    if (!mod?.id) { setLecons([]); return }
    setLoadingLecons(true)
    setActiveLecon(0)
    setQuizScore(null)
    getLecons(mod.id)
      .then(setLecons)
      .catch(() => setLecons([]))
      .finally(() => setLoadingLecons(false))
  }, [modules, activeModule])

  useEffect(() => {
    if (!userId || !coursId || startedSynced) return
    setStartedSynced(true)
    demarrerFormation(userId, coursId).catch(() => setStartedSynced(false))
  }, [userId, coursId, startedSynced])

  useEffect(() => {
    if (!userId || !coursId || modules.length === 0) return
    getModulesTermines(userId, coursId)
      .then(termines => {
        setProgress(p => {
          const next = { ...p }
          modules.forEach((m, i) => { if (m.id && termines.has(m.id)) next[i] = true })
          return next
        })
      })
      .catch(() => {})
  }, [userId, coursId, modules])

  useEffect(() => {
    if (!userId || !coursId || completedSynced || modules.length === 0) return
    const done = Object.values(progress).filter(Boolean).length
    if (done < modules.length) return
    setCompletedSynced(true)
    terminerFormation(userId, coursId).catch(() => setCompletedSynced(false))
  }, [userId, coursId, completedSynced, progress, modules.length])

  function marquerModuleActuelTermine() {
    setProgress(p => ({ ...p, [activeModule]: true }))
    const mod = modules[activeModule]
    if (userId && coursId && mod?.id) {
      marquerModuleTermine(userId, coursId, mod.id).catch(() => {})
    }
  }

  function handleQuizFinish(score: number, total: number) {
    setQuizScore(score)
    if (score / total >= 0.6) marquerModuleActuelTermine()
  }

  const hasQuizLecon = lecons.some(l => l.type === 'quiz')
  const isLastLecon = activeLecon + 1 >= lecons.length

  function goNextModule() {
    if (activeModule + 1 < modules.length) {
      setActiveModule(i => i + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goNextLecon() {
    if (!isLastLecon) {
      setActiveLecon(i => i + 1)
      setQuizScore(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      goNextModule()
    }
  }

  function handleNonQuizContinue() {
    if (isLastLecon && !hasQuizLecon) marquerModuleActuelTermine()
    goNextLecon()
  }

  if (loading) return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="page-loader-ring" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-light)', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase' }}>Chargement du cours…</p>
    </div>
  )
  if (!cours) return <div style={{ padding: 40 }}>Cours introuvable.</div>

  const mod = modules[activeModule]
  const lecon = lecons[activeLecon]
  const done = Object.values(progress).filter(Boolean).length

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* Header cours */}
      <div style={{ background: `linear-gradient(135deg, ${cours.couleur}, var(--primary-mid))`, padding: '110px var(--pad-x) 32px', color: 'white' }}>
        <div className="inner" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <button
              onClick={() => navigate('/catechese')}
              style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', borderRadius: 'var(--r-sm)', padding: '7px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={telechargerHorsLigne}
              disabled={telechargement || horsLigne}
              style={{
                background: horsLigne ? 'rgba(56,142,60,.25)' : 'rgba(255,255,255,.15)', border: 'none', color: 'white',
                borderRadius: 'var(--r-sm)', padding: '7px 14px', fontSize: 12,
                cursor: (telechargement || horsLigne) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, opacity: telechargement ? 0.7 : 1,
              }}
            >
              {horsLigne ? '✓ Disponible hors ligne' : telechargement ? 'Téléchargement…' : '📥 Télécharger pour hors ligne'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 48 }}>{cours.emoji}</span>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em', opacity: .8, marginBottom: 4 }}>
                Niveau {cours.niveau} · {cours.tranche}
              </p>
              <h1 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{cours.titre}</h1>
            </div>
          </div>

          {modules.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .8, marginBottom: 6 }}>
                <span>{done}/{modules.length} modules complétés</span>
                <span>{Math.round((done / modules.length) * 100)}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,.25)', borderRadius: 4, height: 5 }}>
                <div style={{ height: '100%', borderRadius: 4, background: 'white', width: `${(done / modules.length) * 100}%`, transition: 'width .5s' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste modules */}
      <div style={{ display: 'flex', gap: 8, padding: '16px var(--pad-x)', overflowX: 'auto', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        {modules.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActiveModule(i)}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
              background: activeModule === i ? cours.couleur : progress[i] ? `${cours.couleur}18` : 'var(--bg-alt)',
              color: activeModule === i ? 'white' : progress[i] ? cours.couleur : 'var(--text-light)',
              fontSize: 12, fontWeight: activeModule === i ? 700 : 500,
              transition: 'all .15s',
            }}
          >
            {progress[i] && activeModule !== i && <Check size={12} />}
            <span>{m.emoji}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{m.ordre}. {m.titre}</span>
          </button>
        ))}
        {modules.length === 0 && !loadingLecons && (
          <p style={{ fontSize: 13, color: 'var(--text-light)', padding: '4px 0' }}>Aucun module publié pour ce cours pour l'instant.</p>
        )}
      </div>

      {/* Contenu module */}
      {mod && (
        <div style={{ padding: '32px var(--pad-x)' }}>
          <div className="inner" style={{ padding: 0, maxWidth: 720 }}>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <span style={{ fontSize: 38 }}>{mod.emoji}</span>
                <div>
                  <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{mod.titre}</h2>
                  {mod.sousTitre && <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 2 }}>{mod.sousTitre}</p>}
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: cours.couleur, width: 48 }} />
            </div>

            {/* Étapes (leçons) du module */}
            {lecons.length > 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                {lecons.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => { setActiveLecon(i); setQuizScore(null) }}
                    style={{
                      padding: '5px 11px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
                      background: activeLecon === i ? 'var(--primary)' : 'var(--bg-alt)',
                      color: activeLecon === i ? 'white' : 'var(--text-light)',
                      fontSize: 11, fontWeight: activeLecon === i ? 700 : 500,
                    }}
                  >
                    {i + 1}. {l.titre}
                  </button>
                ))}
              </div>
            )}

            {loadingLecons ? (
              <p style={{ color: 'var(--text-light)' }}>Chargement…</p>
            ) : lecon ? (
              <>
                {lecon.type !== 'quiz' && (
                  <>
                    <LeconContent lecon={lecon} />
                    <button onClick={handleNonQuizContinue} className="btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: 28 }}>
                      {isLastLecon ? (hasQuizLecon ? 'Continuer' : 'Terminer le module') : 'Leçon suivante →'}
                    </button>
                  </>
                )}

                {lecon.type === 'quiz' && quizScore === null && lecon.quiz.length > 0 && (
                  <>
                    <p style={{ fontSize: 14, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <GraduationCap size={17} /> Quiz — {lecon.quiz.length} questions
                    </p>
                    <Quiz questions={lecon.quiz} onFinish={score => handleQuizFinish(score, lecon.quiz.length)} />
                  </>
                )}

                {lecon.type === 'quiz' && quizScore !== null && (
                  <QuizResultat
                    score={quizScore}
                    total={lecon.quiz.length}
                    continueLabel={isLastLecon ? 'Module suivant →' : 'Leçon suivante →'}
                    onRetry={() => setQuizScore(null)}
                    onContinue={goNextLecon}
                  />
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-alt)', borderRadius: 'var(--r-md)' }}>
                <p style={{ color: 'var(--text-light)', marginBottom: 16 }}>Aucun contenu pour ce module.</p>
                {!progress[activeModule] && (
                  <button onClick={marquerModuleActuelTermine} className="btn-outline">Marquer comme terminé</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
