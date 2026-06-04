import { useEffect, useState } from 'react'
import { getEvenements, type Evenement, type EvenementType } from '../services/evenements'

const TABS: { key: EvenementType | 'tous'; label: string; icon: string }[] = [
  { key: 'tous',      label: 'Tout',        icon: 'grid_view' },
  { key: 'live',      label: 'En direct',   icon: 'sensors' },
  { key: 'replay',    label: 'Replays',     icon: 'play_circle' },
  { key: 'evenement', label: 'Événements',  icon: 'event' },
]

const PLATFORM_COLORS = { youtube: '#FF0000', facebook: '#1877F2' }

function EvenementCard({ ev }: { ev: Evenement }) {
  const [showEmbed, setShowEmbed] = useState(ev.type === 'live' && !!ev.estEnLive)

  function getEmbedUrl() {
    if (ev.platform === 'youtube' && ev.videoId) {
      return `https://www.youtube.com/embed/${ev.videoId}?autoplay=${ev.estEnLive ? 1 : 0}&rel=0`
    }
    if (ev.platform === 'facebook') {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(ev.url)}&show_text=false`
    }
    return null
  }

  const embedUrl = getEmbedUrl()

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      overflow: 'hidden', marginBottom: 16,
      boxShadow: '0 2px 12px rgba(0,35,111,0.08)',
      border: ev.estEnLive ? '2px solid #ff3b30' : '1px solid rgba(0,35,111,0.08)',
    }}>
      {/* Badge LIVE */}
      {ev.estEnLive && (
        <div style={{
          background: '#ff3b30', color: 'white',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', fontSize: 12, fontWeight: 700,
        }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8,
            borderRadius: '50%', background: 'white',
            animation: 'pulse 1.2s infinite',
          }} />
          EN DIRECT MAINTENANT
        </div>
      )}

      {/* Thumbnail ou embed */}
      {showEmbed && embedUrl ? (
        <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
          <iframe
            src={embedUrl}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={ev.titre}
          />
        </div>
      ) : (
        <div
          style={{ position: 'relative', paddingBottom: '56.25%', cursor: 'pointer', background: '#1a1a2e' }}
          onClick={() => setShowEmbed(true)}
        >
          {ev.thumbnail && (
            <img
              src={ev.thumbnail}
              alt={ev.titre}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: PLATFORM_COLORS[ev.platform],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              transition: 'transform 0.15s',
            }}>
              <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                {ev.platform === 'youtube' ? 'smart_display' : 'play_circle'}
              </span>
            </div>
          </div>
          {/* Platform badge */}
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: PLATFORM_COLORS[ev.platform],
            color: 'white', borderRadius: 6,
            padding: '3px 8px', fontSize: 11, fontWeight: 700,
          }}>
            {ev.platform === 'youtube' ? 'YouTube' : 'Facebook'}
          </div>
        </div>
      )}

      {/* Infos */}
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
          {ev.titre}
        </h3>
        {ev.description && (
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.55, marginBottom: 10 }}>
            {ev.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
            {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {ev.heure && ` · ${ev.heure}`}
          </span>
          {!showEmbed && (
            <button
              onClick={() => setShowEmbed(true)}
              style={{
                marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: 'none',
                background: PLATFORM_COLORS[ev.platform], color: 'white',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              Regarder
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}

export function EvenementsPage() {
  const [tab, setTab] = useState<EvenementType | 'tous'>('tous')
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getEvenements(tab === 'tous' ? undefined : tab)
      .then(setEvenements)
      .catch(() => setEvenements([]))
      .finally(() => setLoading(false))
  }, [tab])

  const lives = evenements.filter(e => e.estEnLive)

  return (
    <div style={{ padding: '0 var(--margin) var(--space-lg)' }}>

      {/* Header */}
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>Médias & Événements</h1>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
          Lives, replays et grands événements de la paroisse
        </p>
      </div>

      {/* Alerte live en cours */}
      {lives.length > 0 && (
        <div style={{
          background: 'rgba(255,59,48,0.08)', border: '1.5px solid #ff3b30',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: '#ff3b30', flexShrink: 0,
            animation: 'pulse 1.2s infinite',
          }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ff3b30' }}>
            {lives.length === 1 ? '1 événement en direct maintenant !' : `${lives.length} événements en direct !`}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 'var(--space-md)',
        overflowX: 'auto', paddingBottom: 4,
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 'var(--r-full)', border: 'none',
              background: tab === t.key ? 'var(--primary)' : 'var(--surface-container)',
              color: tab === t.key ? 'white' : 'var(--on-surface-variant)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--primary)' }}>hourglass_top</span>
          <p style={{ marginTop: 8 }}>Chargement…</p>
        </div>
      ) : evenements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>videocam_off</span>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>Aucun contenu disponible pour le moment.</p>
        </div>
      ) : (
        evenements.map(ev => <EvenementCard key={ev.id} ev={ev} />)
      )}
    </div>
  )
}
