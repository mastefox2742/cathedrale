import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, Search } from 'lucide-react'
import { getEvenements, PUBLIC_CIBLE_LABELS, type Evenement, type PublicCible } from '../services/evenements'
import { getDirectsAVenir, getPlaylistsPubliques, type Direct, type Playlist } from '../services/mediation'
import { getMediasPublics, formatSize, type Media } from '../services/medias'
import { youtubeEmbed } from '../services/parcours'
import { VideoCard } from '../components/VideoCard'

type Onglet = 'chaine' | 'replays' | 'mediatheque'

/** Filtres « par public » proposés en tête de page. */
const FILTRES: { key: PublicCible | 'tous'; label: string }[] = [
  { key: 'tous', label: 'Tout' },
  { key: 'decouvre', label: 'Je découvre' },
  { key: 'baptise', label: 'Je suis baptisé' },
  { key: 'prier', label: 'Je veux prier' },
  { key: 'conversion', label: 'Je veux me convertir' },
  { key: 'jeunes', label: 'Jeunes' },
  { key: 'famille', label: 'Famille' },
]

function fmtDebut(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '9px 22px',
    background: active ? 'var(--gold)' : 'var(--anthracite)',
    border: '1px solid var(--border-accent)',
    color: active ? 'var(--black)' : 'var(--grey)',
    fontFamily: 'var(--v2-font-sans)', fontSize: 10, fontWeight: 700,
    letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s',
  }
}

export function TvPage() {
  const [params, setParams] = useSearchParams()
  const [videos, setVideos] = useState<Evenement[]>([])
  const [directs, setDirects] = useState<Direct[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [medias, setMedias] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [theme, setTheme] = useState('')

  const onglet = (params.get('onglet') as Onglet) || 'chaine'
  const filtre = (params.get('public') as PublicCible | 'tous') || 'tous'

  function setParam(k: string, v: string) {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    setParams(next, { replace: true })
  }

  useEffect(() => {
    Promise.all([
      getEvenements().catch(() => []),
      getDirectsAVenir().catch(() => []),
      getPlaylistsPubliques().catch(() => []),
      getMediasPublics().catch(() => []),
    ]).then(([v, d, p, m]) => { setVideos(v); setDirects(d); setPlaylists(p); setMedias(m) })
      .finally(() => setLoading(false))
  }, [])

  const enDirect = [
    ...directs.filter(d => d.statut === 'en_direct'),
  ]
  const liveVideos = videos.filter(v => v.type === 'live' && v.estEnLive)
  const aVenir = directs.filter(d => d.statut === 'programme')

  const parId = useMemo(() => new Map(videos.map(v => [v.id, v])), [videos])
  const playlistsFiltrees = playlists
    .filter(p => filtre === 'tous' || p.publicCible === filtre)
    .map(p => ({ ...p, videos: p.evenementIds.map(id => parId.get(id)).filter((v): v is Evenement => !!v) }))
    .filter(p => p.videos.length > 0)

  const themes = [...new Set(videos.map(v => v.theme).filter((t): t is string => !!t))].sort()
  const replays = videos.filter(v => {
    if (filtre !== 'tous' && v.publicCible !== filtre) return false
    if (theme && v.theme !== theme) return false
    const q = recherche.trim().toLowerCase()
    if (q && !`${v.titre} ${v.description} ${v.intervenant ?? ''} ${v.theme ?? ''}`.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Médiation &amp; Évangélisation</p>
          <h1>La chaîne <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>de l'archidiocèse</em></h1>
        </div>
      </div>

      <div style={{ padding: 'var(--space-lg) 0 var(--space-xl)' }}>
        <div className="inner">

          {/* ══ EN DIRECT ══ */}
          {[...enDirect.map(d => ({ key: d.id, titre: d.titre, url: d.url, desc: d.description })),
            ...liveVideos.map(v => ({ key: v.id ?? v.url, titre: v.titre, url: v.url, desc: v.description }))].map(l => {
            const embed = youtubeEmbed(l.url)
            return (
              <div key={l.key} className="reveal" style={{ marginBottom: 32, padding: 24, border: '1px solid rgba(200,40,40,.3)', background: 'rgba(139,26,26,.1)' }}>
                <div className="live-badge" style={{ marginBottom: 14 }}>
                  <span className="live-dot" />EN DIRECT MAINTENANT
                </div>
                <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{l.titre}</h3>
                {l.desc && <p style={{ fontSize: 13, color: 'var(--text-light)' }}>{l.desc}</p>}
                {embed ? (
                  <div style={{ aspectRatio: '16/9', marginTop: 16 }}>
                    <iframe src={`${embed}?autoplay=1`} title={l.titre} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                ) : (
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ marginTop: 16 }}>Regarder le direct ↗</a>
                )}
              </div>
            )
          })}

          {/* ══ FILTRES PAR PUBLIC ══ */}
          <div className="reveal" style={{ marginBottom: 24 }}>
            <span className="section-label">Je cherche…</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {FILTRES.map(f => (
                <button key={f.key} onClick={() => setParam('public', f.key === 'tous' ? '' : f.key)} style={{
                  padding: '7px 16px', borderRadius: 'var(--r-full)', cursor: 'pointer', transition: 'all .2s',
                  border: `1.5px solid ${filtre === f.key ? 'var(--primary)' : 'var(--border-accent)'}`,
                  background: filtre === f.key ? 'var(--primary)' : 'transparent',
                  color: filtre === f.key ? '#fff' : 'var(--text-mid)',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 2, marginBottom: 36, flexWrap: 'wrap' }}>
            <button onClick={() => setParam('onglet', '')} style={tabStyle(onglet === 'chaine')}>La chaîne</button>
            <button onClick={() => setParam('onglet', 'replays')} style={tabStyle(onglet === 'replays')}>Tous les replays</button>
            <button onClick={() => setParam('onglet', 'mediatheque')} style={tabStyle(onglet === 'mediatheque')}>Médiathèque</button>
          </div>

          {loading && <div className="page-loader"><div className="page-loader-ring" /></div>}

          {/* ══ LA CHAÎNE : directs à venir + playlists ══ */}
          {!loading && onglet === 'chaine' && (
            <>
              <section style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="reveal" style={{ marginBottom: 18 }}>
                  <span className="section-label">Programme</span>
                  <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 700, color: 'var(--text)' }}>Prochains directs</h2>
                </div>
                {aVenir.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Aucun direct programmé pour le moment.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {aVenir.map(d => (
                      <div key={d.id} className="reveal" style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 16, alignItems: 'center', padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <CalendarClock size={22} color="var(--blue)" />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 4 }}>{fmtDebut(d.debut)}</p>
                          <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{d.titre}</h3>
                          {(d.intervenant || d.description) && (
                            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>{[d.intervenant, d.description].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>Lien ↗</a>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {playlistsFiltrees.map(p => (
                <section key={p.id} style={{ marginBottom: 'var(--space-lg)' }}>
                  <div className="reveal" style={{ marginBottom: 18 }}>
                    <span className="section-label">{PUBLIC_CIBLE_LABELS[p.publicCible]}</span>
                    <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 700, color: 'var(--text)' }}>{p.titre}</h2>
                    {p.description && <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6 }}>{p.description}</p>}
                  </div>
                  <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {p.videos.map(v => <VideoCard key={v.id} ev={v} />)}
                  </div>
                </section>
              ))}

              {playlistsFiltrees.length === 0 && (
                <section>
                  <div className="reveal" style={{ marginBottom: 18 }}>
                    <span className="section-label">Replays</span>
                    <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 700, color: 'var(--text)' }}>Dernières vidéos</h2>
                  </div>
                  <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {replays.slice(0, 9).map(v => <VideoCard key={v.id} ev={v} />)}
                  </div>
                  {replays.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Aucune vidéo disponible pour le moment.</p>}
                </section>
              )}
            </>
          )}

          {/* ══ TOUS LES REPLAYS ══ */}
          {!loading && onglet === 'replays' && (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                <div style={{ position: 'relative', flex: '1 1 260px' }}>
                  <Search size={15} color="var(--text-light)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un titre, un intervenant, un thème…"
                    className="dark-input" style={{ width: '100%', paddingLeft: 34 }} />
                </div>
                {themes.length > 0 && (
                  <select value={theme} onChange={e => setTheme(e.target.value)} className="dark-input" style={{ flex: '0 1 220px' }}>
                    <option value="">Tous les thèmes</option>
                    {themes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>
              <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {replays.map(v => <VideoCard key={v.id} ev={v} />)}
              </div>
              {replays.length === 0 && (
                <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Aucune vidéo ne correspond à votre recherche.</p>
              )}
            </>
          )}

          {/* ══ MÉDIATHÈQUE ══ */}
          {!loading && onglet === 'mediatheque' && (
            medias.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>La médiathèque publique est vide pour le moment.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {medias.map(m => (
                  <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="dark-card reveal" style={{ overflow: 'hidden', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                    {m.type === 'photo' ? (
                      <img src={m.url} alt={m.nom} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-alt)', fontSize: 40 }}>
                        {m.type === 'document' ? '📄' : m.type === 'audio' ? '🎧' : '🎬'}
                      </div>
                    )}
                    <div style={{ padding: 14 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 6 }}>{m.categorie}</p>
                      <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{m.nom}</p>
                      {m.taille ? <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>{formatSize(m.taille)}</p> : null}
                    </div>
                  </a>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}
