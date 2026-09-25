'use client'

import { useState } from 'react'
import { Check, X as XIcon } from 'lucide-react'
import type { QuizQuestion } from '../services/catechisme'

// ── Quiz ──────────────────────────────────────────────────────────────────────
export function Quiz({ questions, onFinish }: { questions: QuizQuestion[]; onFinish: (score: number) => void }) {
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
    <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--r-md)', padding: 24, marginTop: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--primary)' }}>
          Question {idx + 1}/{questions.length}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Score : {score}</span>
      </div>

      <div style={{ background: 'rgba(30,58,95,.1)', borderRadius: 4, height: 4, marginBottom: 24 }}>
        <div style={{ height: '100%', borderRadius: 4, background: 'var(--blue)', width: `${(idx / questions.length) * 100}%`, transition: 'width .3s' }} />
      </div>

      <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 18, lineHeight: 1.5 }}>
        {q.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.reponses.map((r, i) => {
          let bg = 'var(--surface)'
          let border = '1.5px solid var(--border)'
          let color = 'var(--text)'
          if (confirmed) {
            if (i === q.bonneReponse) { bg = 'rgba(56,142,60,.1)'; border = '2px solid #388E3C'; color = '#388E3C' }
            else if (i === selected) { bg = 'rgba(198,40,40,.08)'; border = '2px solid #C62828'; color = '#C62828' }
          } else if (selected === i) {
            bg = 'rgba(30,58,95,.06)'; border = '2px solid var(--primary)'; color = 'var(--primary)'
          }
          return (
            <button
              key={i}
              disabled={confirmed}
              onClick={() => setSelected(i)}
              style={{
                padding: '13px 16px', borderRadius: 'var(--r-sm)', border, background: bg, color,
                fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: confirmed ? 'default' : 'pointer',
                transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                border: '2px solid currentColor',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {confirmed && i === q.bonneReponse ? <Check size={13} /> : confirmed && i === selected && !isCorrect ? <XIcon size={13} /> : String.fromCharCode(65 + i)}
              </span>
              {r}
            </button>
          )
        })}
      </div>

      {confirmed && q.explication && (
        <div style={{
          marginTop: 16, padding: '14px 16px', borderRadius: 'var(--r-sm)',
          background: isCorrect ? 'rgba(56,142,60,.08)' : 'rgba(198,40,40,.06)',
          border: `1px solid ${isCorrect ? '#388E3C' : '#C62828'}40`,
        }}>
          <p style={{ fontSize: 13, color: isCorrect ? '#388E3C' : '#C62828', fontWeight: 700, marginBottom: 4 }}>
            {isCorrect ? 'Bonne réponse !' : 'Pas tout à fait…'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-light)' }}>{q.explication}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        {!confirmed ? (
          <button
            onClick={confirm}
            disabled={selected === null}
            className="btn-gold"
            style={{ flex: 1, justifyContent: 'center', opacity: selected !== null ? 1 : .4, cursor: selected !== null ? 'pointer' : 'not-allowed' }}
          >
            Valider
          </button>
        ) : (
          <button onClick={next} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
            {idx + 1 < questions.length ? 'Question suivante →' : 'Voir mes résultats'}
          </button>
        )}
      </div>
    </div>
  )
}
