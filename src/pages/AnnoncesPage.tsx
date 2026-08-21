import { useEffect, useState } from 'react'
import { getAnnonces, type Annonce, type TagType } from '../services/annonces'

const TAGS: ('tous' | TagType)[] = ['tous', 'Liturgie', 'Formation', 'Prière', 'Événement']

const FALLBACK: Annonce[] = [
  { titre: 'Messe Solennelle — Fête du Sacré-Cœur', desc: "Célébration présidée par Monseigneur l'Archevêque à 10h. Procession eucharistique.", tag: 'Liturgie', date: '2026-06-27', epingle: true, publie: true },
  { titre: 'Inscriptions Catéchisme 2026–2027 ouvertes', desc: 'Rendez-vous au secrétariat du lundi au vendredi de 9h à 13h. Acte de baptême requis.', tag: 'Formation', date: '2026-06-10', epingle: false, publie: true },
  { titre: 'Retraite Spirituelle du Carême', desc: 'Trois jours animés par un prêtre de la cathédrale. Thème : Le désert et la lumière.', tag: 'Prière', date: '2026-06-15', epingle: false, publie: true },
  { titre: 'Concert de la Schola Cantorum', desc: 'Polyphonie renaissance et chant grégorien · Entrée libre · 18h30.', tag: 'Événement', date: '2026-07-08', epingle: false, publie: true },
  { titre: 'Collecte pour les familles dans le besoin', desc: 'Dépôt de vivres et vêtements chaque dimanche après la messe de 11h.', tag: 'Événement', date: '2026-07-01', epingle: false, publie: true },
  { titre: 'Parcours Alpha — Nouvelle session', desc: '10 soirées conviviales pour explorer les questions de foi. Dîner inclus.', tag: 'Formation', date: '2026-07-20', epingle: false, publie: true },
]

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return {
    day:   d.toLocaleDateString('fr-FR', { day: '2-digit' }),
    month: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
  }
}

export function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [filtre, setFiltre] = useState<'tous' | TagType>('tous')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnnonces().then(setAnnonces).catch(() => setAnnonces(FALLBACK)).finally(() => setLoading(false))
  }, [])

  const visible = filtre === 'tous' ? annonces : annonces.filter(a => a.tag === filtre)

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Vie paroissiale</p>
          <h1>Annonces <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>&amp; Agenda</em></h1>
        </div>
      </div>

      <div style={{ padding: 'var(--space-lg) 0 var(--space-xl)' }}>
        <div className="inner">

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid rgba(193,164,97,.1)' }}>
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setFiltre(tag)}
                style={{
                  padding: '7px 18px',
                  border: '1px solid rgba(193,164,97,.2)',
                  background: filtre === tag ? 'var(--gold)' : 'none',
                  color: filtre === tag ? 'var(--black)' : 'var(--grey)',
                  fontFamily: 'var(--v2-font-sans)',
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '.12em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all .2s',
                }}
                onMouseEnter={e => { if (filtre !== tag) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)' } }}
                onMouseLeave={e => { if (filtre !== tag) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(193,164,97,.2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--grey)' } }}
              >
                {tag === 'tous' ? 'Tous' : tag}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="page-loader-ring" style={{ margin: '0 auto' }} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {visible.map((a, i) => {
              const dt = formatDate(a.date)
              return (
                <div key={a.id || i} className="reveal annonce-row" style={{
                  display: 'grid', gridTemplateColumns: '80px 1px 1fr auto',
                  alignItems: 'stretch', gap: 0,
                  background: 'var(--surface)',
                  border: `1px solid ${a.epingle ? 'rgba(193,164,97,.2)' : 'rgba(193,164,97,.07)'}`,
                  transition: 'border-color .25s, background .25s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-alt)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(193,164,97,.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLDivElement).style.borderColor = a.epingle ? 'rgba(193,164,97,.2)' : 'rgba(193,164,97,.07)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 32, fontWeight: 700, color: 'var(--blue)', lineHeight: 1 }}>{dt.day}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-light)' }}>{dt.month}</span>
                  </div>

                  <div style={{ background: 'rgba(193,164,97,.1)', width: 1, margin: '16px 0' }} />

                  <div style={{ padding: '24px 28px' }}>
                    <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
                      {a.epingle && '📌 '}{a.tag}
                    </span>
                    <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: 8 }}>{a.titre}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300, lineHeight: 1.7 }}>{a.desc}</p>
                  </div>

                  <div className="annonce-arrow-col" style={{ display: 'flex', alignItems: 'center', padding: '0 24px', color: 'var(--blue)', fontSize: 18, opacity: .35 }}>→</div>
                </div>
              )
            })}

            {!loading && visible.length === 0 && (
              <p style={{ color: 'var(--text-light)', fontSize: 14, textAlign: 'center', padding: '48px 0' }}>Aucune annonce pour ce filtre.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
