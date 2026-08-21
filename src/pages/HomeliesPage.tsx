import { useEffect, useRef, useState } from 'react'
import { getHomelies, type Homelie } from '../services/homelies'
import { Play, Pause, Volume2 } from 'lucide-react'

const FALLBACK: Homelie[] = []

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-alt)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
      <audio ref={audioRef} src={url}
        onTimeUpdate={e => setProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100 || 0)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />
      <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {playing
          ? <Pause size={16} color="#fff" />
          : <Play size={16} color="#fff" style={{ marginLeft: 2 }} />
        }
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            if (audioRef.current) audioRef.current.currentTime = pct * audioRef.current.duration
          }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--blue)', borderRadius: 2, transition: 'width .1s' }} />
        </div>
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0 }}>
        {duration ? fmt(duration) : '—'}
      </span>
      <Volume2 size={14} color="var(--text-light)" />
    </div>
  )
}

function HomelieCard({ h }: { h: Homelie }) {
  const [open, setOpen] = useState(false)
  const d = new Date(h.date + 'T12:00:00')
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const preview = h.texte.slice(0, 200)

  return (
    <article style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: 12,
      transition: 'box-shadow .2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
    >
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--primary), var(--blue))' }} />

      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 16 }}>
          <div className="homelie-date-col" style={{ textAlign: 'center', flexShrink: 0, minWidth: 52 }}>
            <div style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
              {d.toLocaleDateString('fr-FR', { day: '2-digit' })}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', marginTop: 2 }}>
              {d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-light)' }}>
              {d.getFullYear()}
            </div>
          </div>

          <div className="homelie-sep" style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />

          <div style={{ flex: 1 }}>
            {h.liturgieRef && (
              <span style={{
                display: 'inline-block', marginBottom: 8,
                padding: '3px 10px', borderRadius: 'var(--r-full)',
                background: 'rgba(74,127,181,.1)', border: '1px solid rgba(74,127,181,.2)',
                fontSize: 10, fontWeight: 600, color: 'var(--blue)', letterSpacing: '.06em',
              }}>
                📖 {h.liturgieRef}
              </span>
            )}
            <h2 style={{
              fontFamily: 'var(--v2-font-serif)', fontSize: 19, fontWeight: 700,
              color: 'var(--text)', lineHeight: 1.3, marginBottom: 6,
            }}>
              {h.titre}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
              {h.pretre} · {dateStr}
            </p>
          </div>

          <button onClick={() => setOpen(!open)} style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'none',
            cursor: 'pointer', color: 'var(--primary)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform .3s, background .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-alt)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >∨</button>
        </div>

        {!open && (
          <p style={{
            fontFamily: 'var(--v2-font-serif)', fontStyle: 'italic',
            fontSize: 14, color: 'var(--text-light)', lineHeight: 1.7,
            cursor: 'pointer',
          }} onClick={() => setOpen(true)}>
            {preview}… <span style={{ color: 'var(--blue)', fontStyle: 'normal', fontWeight: 600 }}>Lire la suite</span>
          </p>
        )}

        {open && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            {h.texte.split('\n\n').map((para, i) => (
              <p key={i} style={{
                fontFamily: 'var(--v2-font-serif)', fontSize: 16,
                lineHeight: 1.95, color: 'var(--text)',
                marginBottom: 16,
              }}>
                {para}
              </p>
            ))}

            {h.audioUrl && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 10 }}>
                  🎙️ Écouter l'homélie
                </p>
                <AudioPlayer url={h.audioUrl} />
              </div>
            )}

            <button onClick={() => setOpen(false)} style={{
              marginTop: 20, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 12, color: 'var(--text-light)',
              textDecoration: 'underline', padding: 0,
            }}>
              Réduire
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export function HomeliesPage() {
  const [homelies, setHomelies] = useState<Homelie[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getHomelies().then(setHomelies).catch(() => setHomelies(FALLBACK)).finally(() => setLoading(false))
  }, [])

  const filtered = homelies.filter(h =>
    search === '' ||
    h.titre.toLowerCase().includes(search.toLowerCase()) ||
    h.pretre.toLowerCase().includes(search.toLowerCase()) ||
    (h.liturgieRef ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Prédication</p>
          <h1>Homélies <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>&amp; Méditations</em></h1>
        </div>
      </div>

      <div style={{ background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
        <div className="inner" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', flex: 1, fontStyle: 'italic', fontFamily: 'var(--v2-font-serif)' }}>
            « La foi vient de ce qu'on entend. » — Romains 10, 17
          </p>
          <input
            type="search"
            placeholder="Rechercher une homélie, un prêtre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="dark-input"
            style={{ width: 280 }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--bg)', padding: 'var(--space-lg) 0 var(--space-xl)' }}>
        <div className="inner">

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="page-loader-ring" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 12, color: 'var(--text-light)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Chargement…</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 10 }}>✝</p>
              <p style={{ color: 'var(--text-light)' }}>Aucune homélie trouvée.</p>
            </div>
          )}

          {!loading && filtered.map(h => <HomelieCard key={h.id} h={h} />)}

        </div>
      </div>
    </>
  )
}
