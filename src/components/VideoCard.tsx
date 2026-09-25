'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { compterVue, type Evenement } from '../services/evenements'

function fmtDate(iso: string, heure?: string) {
  const d = new Date(iso + 'T12:00:00')
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return heure ? `${date} · ${heure}` : date
}

export function VideoCard({ ev }: { ev: Evenement }) {
  const [playing, setPlaying] = useState(false)
  const isLive = ev.type === 'live'
  const isYT = ev.platform === 'youtube'

  return (
    <div className="dark-card reveal" style={{ overflow: 'hidden' }}>
      <div style={{ aspectRatio: '16/9', position: 'relative', background: 'var(--surface-mid)', cursor: 'pointer', overflow: 'hidden' }}
        onClick={() => { if (!playing && ev.id) compterVue(ev.id); setPlaying(true) }}>
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
        {(ev.intervenant || ev.theme) && (
          <p style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 8 }}>
            {ev.intervenant}{ev.intervenant && ev.theme ? ' · ' : ''}{ev.theme}
          </p>
        )}
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
