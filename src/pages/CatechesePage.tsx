import { PageWrapper } from '../components/layout/PageWrapper'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const TABS = ['Inscription', 'Niveaux', 'Catéchistes']
const PARCOURS = [
  {
    num: '01', titre: 'Éveil à la Foi', tranche: '6 – 8 ans',
    desc: 'Découverte de Dieu, de Jésus et de l\'Église via histoires bibliques et prières adaptées.',
    modules: 12, accent: 'var(--liturgy-green)',
    icon: 'emoji_nature',
  },
  {
    num: '02', titre: 'Première Communion', tranche: '8 – 10 ans',
    desc: 'Préparation aux sacrements de la Réconciliation et de l\'Eucharistie.',
    modules: 18, accent: 'var(--primary)',
    icon: 'local_dining',
  },
  {
    num: '03', titre: 'Confirmation', tranche: '12 – 15 ans',
    desc: 'Approfondissement des dons du Saint-Esprit et de la vie chrétienne.',
    modules: 24, accent: 'var(--liturgy-red)',
    icon: 'whatshot',
  },
  {
    num: '04', titre: 'RICA — Adultes', tranche: 'Tout âge',
    desc: 'Catéchuménat pour adultes non baptisés, parcours progressif jusqu\'aux sacrements.',
    modules: 36, accent: 'var(--secondary)',
    icon: 'water_drop',
  },
]

const STATS = [
  { label: 'Catéchistes', value: '48+', icon: 'groups' },
  { label: 'Enfants inscrits', value: '320+', icon: 'child_care' },
  { label: 'Modules', value: '90+', icon: 'book' },
  { label: 'Certifiés 2025-26', value: '85', icon: 'workspace_premium' },
]

export function CatechesePage() {
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

      {/* ── Parcours ── */}
      <h2 className="text-title-md" style={{ color: 'var(--primary)', marginBottom: 'var(--space-sm)' }}>Nos parcours</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'var(--space-lg)' }}>
        {PARCOURS.map((p, i) => (
          <div
            key={p.num}
            className={`card card-interactive animate-slide-up`}
            style={{
              padding: 'var(--space-md)',
              borderLeft: `4px solid ${p.accent}`,
              animationDelay: `${i * 60}ms`,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-lg)',
                background: `${p.accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ color: p.accent, fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h3 className="text-title-md" style={{ color: 'var(--primary)', fontSize: 18 }}>{p.titre}</h3>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: p.accent,
                    background: `${p.accent}14`, padding: '3px 8px',
                    borderRadius: 'var(--r-full)', whiteSpace: 'nowrap', marginLeft: 8,
                  }}>{p.tranche}</span>
                </div>
                <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.55, marginBottom: 12 }}>{p.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{p.modules}</span> modules
                  </span>
                  <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>
                    S'inscrire
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
