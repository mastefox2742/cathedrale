import { useEffect, useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'

interface Lecture {
  titre: string
  ref: string
  contenu: string
  isEvangile: boolean
  isPsaume: boolean
}

interface LiturgieData {
  date: string
  couleur: string
  fete: string
  lectures: Lecture[]
}

const COULEURS: Record<string, { stripe: string; bg: string; label: string }> = {
  vert:   { stripe: '#2e7d32', bg: '#e8f5e9', label: 'Temps Ordinaire' },
  rouge:  { stripe: '#c62828', bg: '#ffebee', label: 'Martyrs · Pentecôte' },
  violet: { stripe: '#6a1b9a', bg: '#f3e5f5', label: 'Avent · Carême' },
  blanc:  { stripe: '#78909c', bg: '#eceff1', label: 'Fêtes du Seigneur' },
  rose:   { stripe: '#e91e63', bg: '#fce4ec', label: 'Gaudete · Laetare' },
  or:     { stripe: '#f9a825', bg: '#fffde7', label: 'Solennités' },
}

function detectCouleur(html: string): string {
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

  // Fête
  const fete = doc.querySelector('.fete, .celebration_name')?.textContent?.trim() || ''

  // Lectures
  const lectureEls = doc.querySelectorAll('.lecture')
  const lectures: Lecture[] = Array.from(lectureEls).map(el => {
    const titreEl = el.querySelector('h4')
    const refEl = el.querySelector('h5')
    const titre = titreEl?.textContent?.trim() || ''
    const refRaw = refEl?.textContent?.trim() || ''
    const refMatch = refRaw.match(/\(([^)]+)\)/)
    const ref = refMatch ? refMatch[1] : refRaw.replace(/«[^»]*»/g, '').trim()

    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('h4, h5, .lecture_link').forEach(h => h.remove())
    const contenu = clone.innerHTML.trim()

    const t = titre.toLowerCase()
    return {
      titre,
      ref,
      contenu,
      isEvangile: t.includes('évangile') || t.includes('evangile'),
      isPsaume: t.includes('psaume'),
    }
  })

  const dateObj = new Date(dateStr + 'T12:00:00')
  const date = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return { date, couleur, fete, lectures }
}

async function fetchLiturgie(date: string): Promise<LiturgieData> {
  const isProd = import.meta.env.PROD
  const url = isProd
    ? `/api/aelf?date=${date}`
    : `/api/aelf/${date}/romain/messe`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  return parseAelf(html, date)
}

// ── Carte lecture ─────────────────────────────────────────────────────────
function LectureCard({ lecture, couleur, defaultOpen = false }: {
  lecture: Lecture; couleur: string; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const coul = COULEURS[couleur] || COULEURS['vert']
  const stripeColor = lecture.isEvangile ? coul.stripe : `${coul.stripe}77`

  const preview = lecture.contenu
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150)

  return (
    <div className="card" style={{
      overflow: 'hidden',
      boxShadow: open ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      transition: 'box-shadow 0.25s',
      border: lecture.isEvangile ? `1px solid ${coul.stripe}33` : undefined,
    }}>
      {/* Barre couleur */}
      <div style={{
        height: lecture.isEvangile ? 4 : 3,
        background: lecture.isEvangile
          ? `linear-gradient(90deg, ${coul.stripe}, ${coul.stripe}88)`
          : stripeColor,
      }} />

      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: open && lecture.isEvangile ? coul.bg : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          padding: 'var(--space-md)', transition: 'background 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                padding: '2px 10px', borderRadius: 'var(--r-full)',
                background: lecture.isEvangile ? coul.stripe : `${coul.stripe}18`,
                color: lecture.isEvangile ? 'white' : coul.stripe,
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
              }}>{lecture.titre}</span>
            </div>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: lecture.isEvangile ? 20 : 17,
              fontWeight: 600, color: 'var(--primary)', lineHeight: 1.3,
            }}>{lecture.ref || lecture.titre}</h3>
            {!open && preview && (
              <p style={{
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                fontSize: 14, color: 'var(--on-surface-variant)',
                lineHeight: 1.65, marginTop: 6,
              }}>{preview}…</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {lecture.isEvangile && (
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface-variant)' }}>volume_up</span>
            )}
            <span className="material-symbols-outlined" style={{
              color: 'var(--on-surface-variant)', fontSize: 22,
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.25s',
            }}>expand_more</span>
          </div>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 var(--space-md) var(--space-md)', borderTop: `1px solid ${coul.stripe}18` }}>
          <div className="aelf-content" dangerouslySetInnerHTML={{ __html: lecture.contenu }} />
          <button style={{
            marginTop: 'var(--space-md)', display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--on-surface-variant)', fontSize: 13, fontWeight: 600,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
            Partager
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
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

  const coul = data ? (COULEURS[data.couleur] || COULEURS['vert']) : COULEURS['vert']
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  function changeDate(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  return (
    <PageWrapper>
      <div>
        {/* ── En-tête ── */}
        <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>Liturgie du Jour</h1>
            {data && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 'var(--r-full)',
                background: coul.bg, fontSize: 11, fontWeight: 700, color: '#333',
                border: `1px solid ${coul.stripe}44`,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: coul.stripe }} />
                {coul.label}
              </span>
            )}
          </div>

          {/* Navigation jours */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <button onClick={() => changeDate(-1)} style={{
              width: 36, height: 36, borderRadius: 'var(--r-full)', border: 'none',
              background: 'var(--surface-container)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>chevron_left</span>
            </button>

            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--on-surface)', textTransform: 'capitalize' as const }}>
                {data?.date || '…'}
              </p>
              {data?.fete && (
                <p style={{ fontSize: 13, color: 'var(--secondary)', fontStyle: 'italic', marginTop: 1 }}>{data.fete}</p>
              )}
            </div>

            <button onClick={() => changeDate(1)} style={{
              width: 36, height: 36, borderRadius: 'var(--r-full)', border: 'none',
              background: 'var(--surface-container)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>chevron_right</span>
            </button>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--r-full)', border: 'none',
                  background: 'var(--primary)', color: 'white', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-sans)',
                }}>Aujourd'hui</button>
            )}
          </div>

          {/* Sélecteur de date */}
          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              border: '1px solid var(--outline-variant)', borderRadius: 8,
              padding: '6px 10px', fontSize: 13, color: 'var(--on-surface)',
              fontFamily: 'var(--font-sans)', background: 'var(--surface-container)',
            }}
          />
        </div>

        {/* Chargement */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '4rem 0', color: 'var(--primary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, animation: 'spin 1s linear infinite' }}>sync</span>
            <span className="text-body-md">Chargement des lectures…</span>
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'var(--outline-variant)', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>menu_book</span>
            <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              Lectures non disponibles pour cette date.
            </p>
            <button onClick={() => {
              setLoading(true)
              fetchLiturgie(selectedDate).then(setData).catch(() => setError(true)).finally(() => setLoading(false))
            }} className="btn-primary" style={{ margin: '0 auto' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              Réessayer
            </button>
          </div>
        )}

        {/* Lectures */}
        {data && !loading && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Évangile ouvert par défaut */}
              {data.lectures.filter(l => l.isEvangile).map((l, i) => (
                <LectureCard key={`ev-${i}`} lecture={l} couleur={data.couleur} defaultOpen />
              ))}
              {/* Autres lectures */}
              {data.lectures.filter(l => !l.isEvangile).map((l, i) => (
                <LectureCard key={`l-${i}`} lecture={l} couleur={data.couleur} />
              ))}
            </div>

            <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
              <a href={`https://www.aelf.org/${selectedDate}/romain/messe`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: 'var(--on-surface-variant)', fontSize: 13, textDecoration: 'none',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
                Voir sur AELF.org
              </a>
            </div>
          </>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .aelf-content p {
            font-family: var(--font-serif);
            font-size: 17px; line-height: 1.85;
            color: var(--on-surface); margin-bottom: 14px;
          }
          .aelf-content p:last-child { margin-bottom: 0; }
          .aelf-content strong { font-weight: 700; color: var(--primary); }
          .aelf-content em { font-style: italic; }
          .aelf-content br { line-height: 2; }
        `}</style>
      </div>
    </PageWrapper>
  )
}
