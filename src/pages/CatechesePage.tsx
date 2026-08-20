import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCours, type Cours } from '../services/catechisme'

const STATS = [
  { label: 'Catéchistes',      value: '48+',  icon: 'groups' },
  { label: 'Enfants inscrits', value: '320+', icon: 'child_care' },
  { label: 'Modules',          value: '90+',  icon: 'book' },
  { label: 'Certifiés 2025-26',value: '85',   icon: 'workspace_premium' },
]

export function CatechesePage() {
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCours()
      .then(setCours)
      .catch(() => setCours([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '0 var(--margin) var(--space-lg)' }}>

      {/* ── Titre ── */}
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>Catéchèse & Formation</h1>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
          Des parcours adaptés à chaque âge pour grandir dans la foi.
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
        marginBottom: 'var(--space-lg)',
      }}>
        {STATS.map(({ label, value, icon }) => (
          <div key={label} className="card" style={{ padding: 'var(--space-md)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-full)', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>{icon}</span>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Parcours depuis Firestore ── */}
      <h2 className="text-title-md" style={{ color: 'var(--primary)', marginBottom: 'var(--space-sm)' }}>Nos parcours</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--primary)' }}>hourglass_top</span>
        </div>
      ) : cours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>school</span>
          <p style={{ marginTop: 8 }}>Les parcours seront disponibles prochainement.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'var(--space-lg)' }}>
          {cours.map((p, i) => (
            <div
              key={p.id}
              className="card card-interactive animate-slide-up"
              style={{
                padding: 'var(--space-md)',
                borderLeft: `4px solid ${p.couleur}`,
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--r-lg)',
                  background: `${p.couleur}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 26,
                }}>
                  {p.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 className="text-title-md" style={{ color: 'var(--primary)', fontSize: 18 }}>{p.titre}</h3>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: p.couleur,
                      background: `${p.couleur}14`, padding: '3px 8px',
                      borderRadius: 'var(--r-full)', whiteSpace: 'nowrap', marginLeft: 8,
                    }}>{p.tranche}</span>
                  </div>
                  <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.55, marginBottom: 12 }}>
                    {p.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{p.totalModules}</span> modules
                    </span>
                    <Link
                      to={`/catechese/${p.id}`}
                      style={{
                        padding: '6px 16px', fontSize: 13, borderRadius: 'var(--r-md)',
                        background: p.couleur, color: 'white', textDecoration: 'none',
                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      Commencer
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA contact ── */}
      <div style={{
        padding: 'var(--space-md)', borderRadius: 'var(--r-xl)',
        background: 'rgba(115,92,0,0.08)', border: '1px solid rgba(115,92,0,0.18)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 30, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>contact_support</span>
        <div style={{ flex: 1 }}>
          <p className="text-label-md" style={{ color: 'var(--on-surface)', marginBottom: 2 }}>Des questions ?</p>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Nos catéchistes vous orientent dans le choix du parcours.</p>
        </div>
        <Link to="/horaires" style={{ flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>chevron_right</span>
        </Link>
      </div>
    </div>
  )
}
