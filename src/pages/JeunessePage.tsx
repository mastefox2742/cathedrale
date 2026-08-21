import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCours, type Cours } from '../services/catechisme'
import { getGroupes, type Groupe } from '../services/groupes'

const NIVEAU_JEUNESSE = 3 // Confirmation — déjà utilisé comme "Ados" côté mobile

function contactHref(contact: string) {
  return contact.includes('@') ? `mailto:${contact}` : `tel:${contact.replace(/\s/g, '')}`
}

export function JeunessePage() {
  const [cours, setCours] = useState<Cours[]>([])
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCours(), getGroupes()])
      .then(([c, g]) => {
        setCours(c.filter(x => x.niveau === NIVEAU_JEUNESSE))
        setGroupes(g.filter(x => x.categorie === 'jeunesse'))
      })
      .catch(() => { setCours([]); setGroupes([]) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Maison numérique des jeunes</p>
          <h1>Espace <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Jeunesse</em></h1>
        </div>
      </div>

      <div className="verse-band">
        <blockquote>
          Une jeunesse capable de vivre sa foi et de servir la société.
          <cite className="verse-ref">— Aumônerie de la cathédrale</cite>
        </blockquote>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner">

          <div className="reveal" style={{ maxWidth: 640, marginBottom: 48 }}>
            <span className="section-label">Formations</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
              Grandir dans la <em style={{ color: 'var(--blue)', fontStyle: 'italic' }}>foi</em>
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8 }}>
              Des parcours de catéchèse adaptés aux adolescents, pour découvrir la foi, la Bible et l'engagement chrétien.
            </p>
          </div>

          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 'var(--space-xl)' }}>Chargement…</p>
          ) : cours.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 'var(--space-xl)' }}>
              Aucun parcours dédié aux adolescents pour le moment.
            </p>
          ) : (
            <div className="grid-med" style={{ marginBottom: 'var(--space-xl)' }}>
              {cours.map(c => (
                <Link key={c.id} to={`/catechese/${c.id}`} className="reveal dark-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10, textDecoration: 'none' }}>
                  <span style={{ fontSize: 30 }}>{c.emoji}</span>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{c.titre}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{c.tranche} · {c.totalModules} modules</p>
                  <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7 }}>{c.description}</p>
                </Link>
              ))}
            </div>
          )}

          <div className="reveal" style={{ maxWidth: 640, marginBottom: 48 }}>
            <span className="section-label">Groupes & mouvements</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700, color: 'var(--text)' }}>
              Vivre la foi <em style={{ color: 'var(--blue)', fontStyle: 'italic' }}>ensemble</em>
            </h2>
          </div>

          {loading ? null : groupes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 'var(--space-xl)' }}>
              Les groupes jeunesse seront bientôt annoncés ici.
            </p>
          ) : (
            <div className="groupes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, background: 'rgba(193,164,97,.06)', marginBottom: 'var(--space-xl)' }}>
              {groupes.map(g => (
                <div key={g.id} className="reveal" style={{ background: 'var(--bg-alt)', padding: '36px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 30 }}>{g.icon}</span>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{g.titre}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300, lineHeight: 1.7, flex: 1 }}>{g.description}</p>
                  {g.horaire && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-dark)', letterSpacing: '.04em' }}>{g.horaire}</span>}
                  {g.contact && (
                    <a href={contactHref(g.contact)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textDecoration: 'underline' }}>
                      Contacter le responsable
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="reveal" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-accent)', padding: 32, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <span className="section-label">Participer</span>
              <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: 'var(--text)' }}>
                Retraites, veillées, événements jeunesse
              </h2>
            </div>
            <Link to="/evenements" className="btn-gold" style={{ flexShrink: 0 }}>Voir tous les événements</Link>
          </div>

        </div>
      </div>
    </>
  )
}
