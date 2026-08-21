import { useEffect, useState } from 'react'

interface Lecture {
  titre: string; ref: string; contenu: string
  isEvangile: boolean; isPsaume: boolean
}
interface LiturgieData {
  date: string; couleur: string; fete: string; lectures: Lecture[]
}

const COULEURS: Record<string, { dot: string; label: string; bg: string; border: string }> = {
  vert:   { dot: '#388E3C', label: 'Temps Ordinaire',    bg: 'rgba(56,142,60,.08)',   border: 'rgba(56,142,60,.25)' },
  rouge:  { dot: '#C62828', label: 'Martyrs · Pentecôte',bg: 'rgba(198,40,40,.08)',   border: 'rgba(198,40,40,.25)' },
  violet: { dot: '#6A1B9A', label: 'Avent · Carême',     bg: 'rgba(106,27,154,.08)',  border: 'rgba(106,27,154,.25)' },
  blanc:  { dot: '#546E7A', label: 'Fêtes du Seigneur',  bg: 'rgba(84,110,122,.08)',  border: 'rgba(84,110,122,.25)' },
  rose:   { dot: '#C2185B', label: 'Gaudete · Laetare',  bg: 'rgba(194,24,91,.08)',   border: 'rgba(194,24,91,.25)' },
  or:     { dot: '#F57F17', label: 'Solennité',           bg: 'rgba(245,127,23,.08)',  border: 'rgba(245,127,23,.25)' },
}

function detectCouleur(html: string) {
  if (/couleur[_-]?violet|carême|avent/i.test(html)) return 'violet'
  if (/couleur[_-]?rouge|rouge\.svg/i.test(html)) return 'rouge'
  if (/couleur[_-]?blanc|blanc\.svg/i.test(html)) return 'blanc'
  if (/couleur[_-]?rose/i.test(html)) return 'rose'
  if (/couleur[_-]?or/i.test(html)) return 'or'
  return 'vert'
}

function parseAelf(html: string, dateStr: string): LiturgieData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const couleur = detectCouleur(html)
  const fete = doc.querySelector('.fete, .celebration_name')?.textContent?.trim() || ''
  const lectures: Lecture[] = Array.from(doc.querySelectorAll('.lecture')).map(el => {
    const titre = el.querySelector('h4')?.textContent?.trim() || ''
    const refRaw = el.querySelector('h5')?.textContent?.trim() || ''
    const ref = refRaw.match(/\(([^)]+)\)/)?.[1] ?? refRaw.replace(/«[^»]*»/g, '').trim()
    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('h4, h5, .lecture_link').forEach(h => h.remove())
    const t = titre.toLowerCase()
    return { titre, ref, contenu: clone.innerHTML.trim(),
      isEvangile: t.includes('évangile') || t.includes('evangile'),
      isPsaume: t.includes('psaume') }
  })
  const date = new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return { date, couleur, fete, lectures }
}

async function fetchLiturgie(date: string): Promise<LiturgieData> {
  const url = import.meta.env.PROD ? `/api/aelf?date=${date}` : `/api/aelf/${date}/romain/messe`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseAelf(await res.text(), date)
}

function LectureCard({ lecture, couleur, defaultOpen = false }:
  { lecture: Lecture; couleur: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const coul = COULEURS[couleur] ?? COULEURS['vert']
  const preview = lecture.contenu.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,200)

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${lecture.isEvangile ? coul.border : 'var(--border)'}`,
      borderRadius: 'var(--r-md)',
      marginBottom: 10,
      overflow: 'hidden',
      boxShadow: lecture.isEvangile ? `0 2px 12px ${coul.border}` : 'var(--shadow-sm)',
    }}>
      <div style={{ height: lecture.isEvangile ? 4 : 2, background: coul.dot }} />

      <button onClick={() => setOpen(!open)} style={{
        width: '100%', background: open ? coul.bg : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '20px 28px', display: 'flex', alignItems: 'flex-start', gap: 16,
        transition: 'background .2s',
      }}
        onMouseEnter={e => { if (!open) (e.currentTarget.style.background = 'var(--bg-alt)') }}
        onMouseLeave={e => { if (!open) (e.currentTarget.style.background = 'transparent') }}
      >
        <div style={{ flex: 1 }}>
          <span style={{
            display: 'inline-block', marginBottom: 8,
            padding: '3px 10px', borderRadius: 'var(--r-full)',
            fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase',
            background: lecture.isEvangile ? coul.dot : 'transparent',
            color: lecture.isEvangile ? '#fff' : coul.dot,
            border: `1px solid ${coul.dot}`,
          }}>
            {lecture.isEvangile ? '✦ ' : ''}{lecture.titre}
          </span>
          <span style={{
            display: 'block',
            fontFamily: 'var(--v2-font-serif)',
            fontSize: lecture.isEvangile ? 20 : 17,
            fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
          }}>
            {lecture.ref || lecture.titre}
          </span>
          {!open && preview && (
            <span style={{
              display: 'block', marginTop: 8,
              fontFamily: 'var(--v2-font-serif)', fontStyle: 'italic',
              fontSize: 13, color: 'var(--text-light)', lineHeight: 1.65,
            }}>
              {preview}…
            </span>
          )}
        </div>
        <span style={{
          color: coul.dot, fontSize: 18, marginTop: 4, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform .3s',
        }}>∨</span>
      </button>

      {open && (
        <div style={{ padding: '0 28px 24px', borderTop: `1px solid ${coul.border}` }}>
          <div className="v2-aelf-lecture-text"
            style={{ paddingTop: 20 }}
            dangerouslySetInnerHTML={{ __html: lecture.contenu }}
          />
          <a href="https://www.aelf.org" target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20,
              fontSize: 11, color: 'var(--text-light)', textDecoration: 'none', transition: 'color .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-light)')}
          >
            ↗ Voir sur AELF.org
          </a>
        </div>
      )}
    </div>
  )
}

export function LiturgiePage() {
  const [data, setData] = useState<LiturgieData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    setLoading(true); setError(false)
    fetchLiturgie(selectedDate)
      .then(setData).catch(() => setError(true)).finally(() => setLoading(false))
  }, [selectedDate])

  function changeDate(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const coul = COULEURS[data?.couleur ?? 'vert'] ?? COULEURS['vert']

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Parole de Dieu</p>
          <h1>Liturgie <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>du Jour</em></h1>
        </div>
      </div>

      <div className="date-bar-inner" style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 0',
        position: 'sticky', top: 60, zIndex: 50,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div className="inner" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => changeDate(-1)} style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'none',
            cursor: 'pointer', color: 'var(--primary)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
          }}
            onMouseEnter={e => { (e.currentTarget.style.background = 'var(--bg-alt)') }}
            onMouseLeave={e => { (e.currentTarget.style.background = 'none') }}
          >‹</button>

          <div style={{ flex: 1 }}>
            <strong style={{
              display: 'block', fontFamily: 'var(--v2-font-serif)',
              fontSize: 16, color: 'var(--text)', textTransform: 'capitalize',
            }}>
              {data?.date || '…'}
            </strong>
            {data?.fete && (
              <span style={{ fontSize: 12, color: 'var(--blue)', fontStyle: 'italic' }}>{data.fete}</span>
            )}
          </div>

          <button onClick={() => changeDate(1)} style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'none',
            cursor: 'pointer', color: 'var(--primary)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
          }}
            onMouseEnter={e => { (e.currentTarget.style.background = 'var(--bg-alt)') }}
            onMouseLeave={e => { (e.currentTarget.style.background = 'none') }}
          >›</button>

          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="dark-input"
            style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
          />

          {!isToday && (
            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="btn-gold" style={{ padding: '7px 16px', fontSize: 10 }}>
              Aujourd'hui
            </button>
          )}

          {data && (
            <span className="couleur-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: coul.bg, border: `1px solid ${coul.border}`,
              borderRadius: 'var(--r-full)',
              fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
              color: coul.dot, flexShrink: 0,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: coul.dot }} />
              {coul.label}
            </span>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg)', padding: 'var(--space-lg) 0 var(--space-xl)', minHeight: '50vh' }}>
        <div className="inner">

          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div className="page-loader-ring" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 12, color: 'var(--text-light)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                Chargement des lectures…
              </p>
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 40, color: 'var(--primary)', marginBottom: 16 }}>✝</p>
              <p style={{ color: 'var(--text-mid)', marginBottom: 24, fontSize: 15 }}>
                Lectures non disponibles pour cette date.
              </p>
              <button className="btn-gold" onClick={() => {
                setLoading(true)
                fetchLiturgie(selectedDate).then(setData).catch(() => setError(true)).finally(() => setLoading(false))
              }}>
                Réessayer
              </button>
            </div>
          )}

          {data && !loading && (
            <>
              {data.lectures.filter(l => l.isEvangile).map((l, i) => (
                <LectureCard key={`ev-${i}`} lecture={l} couleur={data.couleur} defaultOpen />
              ))}
              {data.lectures.filter(l => !l.isEvangile).map((l, i) => (
                <LectureCard key={`l-${i}`} lecture={l} couleur={data.couleur} />
              ))}

              <div style={{ marginTop: 40, textAlign: 'center', paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <a href={`https://www.aelf.org/${selectedDate}/romain/messe`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: 'var(--text-light)', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-light)')}
                >
                  ↗ Consulter le calendrier liturgique complet sur AELF.org
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .v2-aelf-lecture-text p,
        .v2-aelf-lecture-text div {
          font-family: var(--v2-font-serif);
          font-size: 17px;
          line-height: 1.95;
          color: var(--text);
          margin-bottom: 14px;
        }
        .v2-aelf-lecture-text p:last-child { margin-bottom: 0; }
        .v2-aelf-lecture-text strong { color: var(--primary); font-weight: 600; }
        .v2-aelf-lecture-text em { font-style: italic; color: var(--text-mid); }
      `}</style>
    </>
  )
}
