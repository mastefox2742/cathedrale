import { useEffect, useState } from 'react'
import { getEvenements, type Evenement } from '../services/evenements'
import { Play } from 'lucide-react'

const FALLBACK: Evenement[] = []

function fmtDate(iso: string, heure?: string) {
  const d = new Date(iso + 'T12:00:00')
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return heure ? `${date} · ${heure}` : date
}

function VideoCard({ ev }: { ev: Evenement }) {
  const [playing, setPlaying] = useState(false)
  const isLive = ev.type === 'live'
  const isYT = ev.platform === 'youtube'

  return (
    <div className="dark-card reveal" style={{ overflow: 'hidden' }}>
      <div style={{ aspectRatio: '16/9', position: 'relative', background: 'var(--surface-mid)', cursor: 'pointer', overflow: 'hidden' }}
        onClick={() => setPlaying(true)}>
        {playing && ev.videoId && isYT ? (
          <iframe
            src={`https://www.youtube.com/embed/${ev.videoId}?autoplay=1`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {ev.thumbnail && (
              <img src={ev.thumbnail} alt={ev.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.65)', transition: 'transform .5s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            )}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(193,164,97,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .2s', boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Play size={20} color="var(--black)" style={{ marginLeft: 3 }} />
              </div>
            </div>
            {isLive && (
              <div style={{ position: 'absolute', top: 12, left: 12 }} className="live-badge">
                <span className="live-dot" />EN DIRECT
              </div>
            )}
            <span style={{
              position: 'absolute', top: 12, right: 12,
              padding: '3px 10px',
              background: ev.platform === 'youtube' ? '#FF0000' : '#1877F2',
              color: 'white', fontSize: 8, fontWeight: 700, letterSpacing: '.1em',
            }}>
              {ev.platform === 'youtube' ? 'YouTube' : 'Facebook'}
            </span>
          </>
        )}
      </div>

      <div style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 8 }}>
          {ev.type === 'live' ? 'En direct' : ev.type === 'replay' ? 'Replay' : 'Événement'}
        </p>
        <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: 8 }}>{ev.titre}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>{fmtDate(ev.date, ev.heure)}</p>
        {ev.description && <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300, lineHeight: 1.6 }}>{ev.description}</p>}
        <a href={ev.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 14, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)', textDecoration: 'none', transition: 'opacity .2s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          ↗ Ouvrir dans {ev.platform === 'youtube' ? 'YouTube' : 'Facebook'}
        </a>
      </div>
    </div>
  )
}

export function EvenementsPage() {
  const [events, setEvents] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'live' | 'replay'>('all')

  useEffect(() => {
    getEvenements().then(setEvents).catch(() => setEvents(FALLBACK)).finally(() => setLoading(false))
  }, [])

  const live  = events.filter(e => e.type === 'live')
  const shown = tab === 'all' ? events : tab === 'live' ? events.filter(e => e.type === 'live') : events.filter(e => e.type === 'replay')

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Médias &amp; Diffusion</p>
          <h1>Messes en Direct <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>&amp; Replays</em></h1>
        </div>
      </div>

      <div style={{ padding: 'var(--space-lg) 0 var(--space-xl)' }}>
        <div className="inner">

          {live.filter(e => e.estEnLive).map((ev, i) => (
            <div key={i} style={{ marginBottom: 32, padding: 24, border: '1px solid rgba(200,40,40,.3)', background: 'rgba(139,26,26,.1)' }}>
              <div className="live-badge" style={{ marginBottom: 14 }}>
                <span className="live-dot" />EN DIRECT MAINTENANT
              </div>
              <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{ev.titre}</h3>
              {ev.videoId && (
                <div style={{ aspectRatio: '16/9', marginTop: 16 }}>
                  <iframe src={`https://www.youtube.com/embed/${ev.videoId}?autoplay=1`} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay" allowFullScreen />
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 2, marginBottom: 36 }}>
            {(['all', 'live', 'replay'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '9px 22px',
                background: tab === t ? 'var(--gold)' : 'var(--anthracite)',
                border: '1px solid var(--border-accent)',
                color: tab === t ? 'var(--black)' : 'var(--grey)',
                fontFamily: 'var(--v2-font-sans)', fontSize: 10, fontWeight: 700,
                letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s',
              }}>
                {t === 'all' ? 'Tous' : t === 'live' ? 'En direct' : 'Replays'}
              </button>
            ))}
          </div>

          {loading && <div className="page-loader"><div className="page-loader-ring" /></div>}

          <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {shown.map((ev, i) => <VideoCard key={ev.id || i} ev={ev} />)}
          </div>

          {!loading && shown.length === 0 && (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>
              Aucune vidéo disponible pour le moment.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
