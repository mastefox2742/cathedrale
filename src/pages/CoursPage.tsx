import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCoursById, getModules, SEED_COURS_EVEIL, SEED_MODULES_EVEIL,
  type Cours, type Module, type QuizQuestion,
} from '../services/catechisme'

// ── Quiz ──────────────────────────────────────────────────────────────────────
function Quiz({ questions, onFinish }: { questions: QuizQuestion[]; onFinish: (score: number) => void }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)

  const q = questions[idx]
  const isCorrect = selected === q.bonneReponse

  function confirm() {
    if (selected === null) return
    setConfirmed(true)
    if (selected === q.bonneReponse) setScore(s => s + 1)
  }

  function next() {
    if (idx + 1 < questions.length) {
      setIdx(i => i + 1)
      setSelected(null)
      setConfirmed(false)
    } else {
      onFinish(score + (selected === q.bonneReponse ? 1 : 0))
    }
  }

  return (
    <div style={{ background: 'var(--surface-container)', borderRadius: 16, padding: '20px', marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
          Question {idx + 1}/{questions.length}
        </span>
        <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Score : {score}</span>
      </div>

      {/* Barre de progression */}
      <div style={{ background: 'rgba(0,35,111,0.1)', borderRadius: 4, height: 6, marginBottom: 20 }}>
        <div style={{
          height: '100%', borderRadius: 4, background: 'var(--primary)',
          width: `${((idx) / questions.length) * 100}%`, transition: 'width 0.3s',
        }} />
      </div>

      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 16, lineHeight: 1.5 }}>
        {q.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.reponses.map((r, i) => {
          let bg = 'white'
          let border = '1.5px solid rgba(0,35,111,0.12)'
          let color = 'var(--on-surface)'
          if (confirmed) {
            if (i === q.bonneReponse) { bg = 'rgba(46,125,50,0.12)'; border = '2px solid #2e7d32'; color = '#2e7d32' }
            else if (i === selected) { bg = 'rgba(198,40,40,0.08)'; border = '2px solid #c62828'; color = '#c62828' }
          } else if (selected === i) {
            bg = 'rgba(0,35,111,0.08)'; border = '2px solid var(--primary)'; color = 'var(--primary)'
          }
          return (
            <button
              key={i}
              disabled={confirmed}
              onClick={() => setSelected(i)}
              style={{
                padding: '12px 14px', borderRadius: 10, border, background: bg, color,
                fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: confirmed ? 'default' : 'pointer',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                border: '2px solid currentColor',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {confirmed && i === q.bonneReponse ? '✓' : confirmed && i === selected && !isCorrect ? '✗' : String.fromCharCode(65 + i)}
              </span>
              {r}
            </button>
          )
        })}
      </div>

      {confirmed && q.explication && (
        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 10,
          background: isCorrect ? 'rgba(46,125,50,0.08)' : 'rgba(198,40,40,0.06)',
          border: `1px solid ${isCorrect ? '#2e7d32' : '#c62828'}40`,
        }}>
          <p style={{ fontSize: 13, color: isCorrect ? '#2e7d32' : '#c62828', fontWeight: 600, marginBottom: 4 }}>
            {isCorrect ? '🎉 Bonne réponse !' : '💡 Pas tout à fait…'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>{q.explication}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {!confirmed ? (
          <button
            onClick={confirm}
            disabled={selected === null}
            style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: selected !== null ? 'var(--primary)' : 'var(--surface-container)',
              color: selected !== null ? 'white' : 'var(--on-surface-variant)',
              fontSize: 14, fontWeight: 700, cursor: selected !== null ? 'pointer' : 'not-allowed',
            }}
          >
            Valider
          </button>
        ) : (
          <button
            onClick={next}
            style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: 'var(--primary)', color: 'white',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {idx + 1 < questions.length ? 'Question suivante →' : 'Voir mes résultats'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Résultat quiz ─────────────────────────────────────────────────────────────
function QuizResultat({ score, total, onRetry, onContinue }: {
  score: number; total: number; onRetry: () => void; onContinue: () => void
}) {
  const pct = Math.round((score / total) * 100)
  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '😊' : '💪'
  const msg = pct === 100 ? 'Parfait ! Tu as tout bon !' : pct >= 80 ? 'Très bien ! Tu maîtrises ce module.' : pct >= 60 ? 'Bien ! Tu peux encore réviser.' : 'Continue, tu vas y arriver !'

  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--surface-container)', borderRadius: 16, marginTop: 24 }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>{emoji}</div>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 8 }}>
        {score}/{total} bonnes réponses
      </h3>
      <p style={{ fontSize: 15, color: 'var(--on-surface-variant)', marginBottom: 20 }}>{msg}</p>
      {/* Barre de score */}
      <div style={{ background: 'rgba(0,35,111,0.1)', borderRadius: 8, height: 12, margin: '0 auto 20px', maxWidth: 240 }}>
        <div style={{
          height: '100%', borderRadius: 8,
          background: pct >= 80 ? '#2e7d32' : pct >= 60 ? '#f57c00' : '#c62828',
          width: `${pct}%`, transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={onRetry} style={{
          padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--primary)',
          background: 'white', color: 'var(--primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Réessayer
        </button>
        {pct >= 60 && (
          <button onClick={onContinue} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Module suivant →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Contenu markdown simplifié ────────────────────────────────────────────────
function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.75, color: 'var(--on-surface)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--primary)', margin: '20px 0 8px' }}>{line.slice(3)}</h2>
        if (line.startsWith('### ')) return <h3 key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--secondary)', margin: '16px 0 6px' }}>{line.slice(4)}</h3>
        if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '4px solid var(--secondary)', paddingLeft: 14, margin: '12px 0', fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>{line.slice(2)}</blockquote>
        if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: 20, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
        if (line.trim() === '') return <br key={i} />
        return <p key={i} style={{ marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
      })}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function CoursPage() {
  const { coursId } = useParams<{ coursId: string }>()
  const navigate = useNavigate()
  const [cours, setCours] = useState<Cours | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [progress, setProgress] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!coursId) return
    Promise.all([getCoursById(coursId), getModules(coursId)])
      .then(([c, m]) => {
        if (c) {
          setCours(c)
          setModules(m.length > 0 ? m : SEED_MODULES_EVEIL.map((sm, i) => ({ ...sm, id: `seed-${i}`, coursId, createdAt: undefined })))
        } else {
          // Fallback : données seed si Firestore vide
          setCours({ ...SEED_COURS_EVEIL, id: coursId })
          setModules(SEED_MODULES_EVEIL.map((sm, i) => ({ ...sm, id: `seed-${i}`, coursId })))
        }
      })
      .catch(() => {
        setCours({ ...SEED_COURS_EVEIL, id: coursId ?? 'eveil' })
        setModules(SEED_MODULES_EVEIL.map((sm, i) => ({ ...sm, id: `seed-${i}`, coursId: coursId ?? 'eveil' })))
      })
      .finally(() => setLoading(false))
  }, [coursId])

  function handleQuizFinish(score: number) {
    setQuizScore(score)
    if (score / modules[activeModule].quiz.length >= 0.6) {
      setProgress(p => ({ ...p, [activeModule]: true }))
    }
  }

  function goNextModule() {
    if (activeModule + 1 < modules.length) {
      setActiveModule(i => i + 1)
      setShowQuiz(false)
      setQuizScore(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) return (
    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--primary)' }}>hourglass_top</span>
      <p style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>Chargement du cours…</p>
    </div>
  )
  if (!cours) return <div style={{ padding: 20 }}>Cours introuvable.</div>

  const mod = modules[activeModule]
  const done = Object.values(progress).filter(Boolean).length

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* Header cours */}
      <div style={{
        background: `linear-gradient(135deg, ${cours.couleur}, ${cours.couleur}cc)`,
        padding: '24px 20px 20px', color: 'white',
      }}>
        <button
          onClick={() => navigate('/catechese')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Retour
        </button>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 48 }}>{cours.emoji}</span>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8, marginBottom: 4 }}>
              Niveau {cours.niveau} · {cours.tranche}
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>{cours.titre}</h1>
          </div>
        </div>

        {/* Progression globale */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            <span>{done}/{modules.length} modules complétés</span>
            <span>{Math.round((done / modules.length) * 100)}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, height: 6 }}>
            <div style={{ height: '100%', borderRadius: 4, background: 'white', width: `${(done / modules.length) * 100}%`, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Liste modules */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', background: 'white', borderBottom: '1px solid var(--surface-container)' }}>
        {modules.map((m, i) => (
          <button
            key={m.id}
            onClick={() => { setActiveModule(i); setShowQuiz(false); setQuizScore(null) }}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeModule === i ? cours.couleur : progress[i] ? `${cours.couleur}18` : 'var(--surface-container)',
              color: activeModule === i ? 'white' : progress[i] ? cours.couleur : 'var(--on-surface-variant)',
              fontSize: 13, fontWeight: activeModule === i ? 700 : 500,
              transition: 'all 0.15s',
            }}
          >
            {progress[i] && activeModule !== i && <span style={{ fontSize: 12 }}>✓</span>}
            <span>{m.emoji}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{m.ordre}. {m.titre}</span>
          </button>
        ))}
      </div>

      {/* Contenu module */}
      {mod && (
        <div style={{ padding: '20px 16px' }}>

          {/* Titre module */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 36 }}>{mod.emoji}</span>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{mod.titre}</h2>
                {mod.sousTitre && <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginTop: 2 }}>{mod.sousTitre}</p>}
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: cours.couleur, width: 48 }} />
          </div>

          {/* Contenu */}
          {!showQuiz && quizScore === null && (
            <>
              <MarkdownContent text={mod.contenu} />

              {/* Activité */}
              {mod.activite && (
                <div style={{
                  marginTop: 24, background: 'rgba(115,92,0,0.06)',
                  border: '1px solid rgba(115,92,0,0.2)',
                  borderRadius: 14, padding: '16px',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    ✏️ Activité
                  </p>
                  <MarkdownContent text={mod.activite} />
                </div>
              )}

              {/* Prière */}
              <div style={{
                marginTop: 20, background: 'linear-gradient(135deg, var(--primary), #0d47a1)',
                borderRadius: 14, padding: '18px', color: 'white',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7, marginBottom: 10 }}>🙏 Prière</p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.7, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{mod.priere}</p>
              </div>

              {/* Bouton quiz */}
              {mod.quiz.length > 0 && (
                <button
                  onClick={() => setShowQuiz(true)}
                  style={{
                    width: '100%', marginTop: 24, padding: '14px',
                    borderRadius: 12, border: 'none',
                    background: cours.couleur, color: 'white',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>quiz</span>
                  Tester mes connaissances ({mod.quiz.length} questions)
                </button>
              )}
            </>
          )}

          {/* Quiz */}
          {showQuiz && quizScore === null && (
            <Quiz questions={mod.quiz} onFinish={handleQuizFinish} />
          )}

          {/* Résultat */}
          {quizScore !== null && (
            <QuizResultat
              score={quizScore}
              total={mod.quiz.length}
              onRetry={() => { setShowQuiz(true); setQuizScore(null) }}
              onContinue={goNextModule}
            />
          )}
        </div>
      )}
    </div>
  )
}
