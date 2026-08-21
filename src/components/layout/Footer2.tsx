import { NavLink } from 'react-router-dom'

const COLS = [
  {
    title: 'Spirituel',
    links: [
      { to: '/liturgie', label: 'Liturgie du jour' },
      { to: '/homelies', label: 'Homélies' },
      { to: '/evenements', label: 'Messes en direct' },
      { to: '/vie-spirituelle', label: 'Vie spirituelle' },
      { to: '/histoire', label: 'Notre Histoire' },
    ],
  },
  {
    title: 'Formation',
    links: [
      { to: '/catechese', label: 'Catéchèse' },
      { to: '/vie-spirituelle', label: 'Formation laïcs' },
    ],
  },
  {
    title: 'Paroisse',
    links: [
      { to: '/annonces', label: 'Annonces' },
      { to: '/horaires', label: 'Horaires & Contact' },
      { to: '/dons', label: 'Don & Offrande' },
      { to: '/abonnements', label: "S'abonner" },
      { to: '/connexion', label: 'Espace Membre' },
      { to: '/signaler', label: 'Signaler une préoccupation' },
    ],
  },
]

export function Footer2() {
  return (
    <footer style={{
      background: 'var(--primary)',
      borderTop: '4px solid var(--accent)',
      padding: 'var(--space-lg) var(--pad-x) 28px',
    }}>
      <div className="v2-footer-grid" style={{
        maxWidth: 'var(--max-w)', margin: '0 auto',
        paddingBottom: 40,
        borderBottom: '1px solid rgba(255,255,255,.1)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--accent)', overflow: 'hidden' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '.03em' }}>
              Cathédrale Sacré-Cœur
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 1.8, maxWidth: 260 }}>
            Plateforme officielle de la Cathédrale Sacré-Cœur de Brazzaville, Archidiocèse du Congo.
            Liturgie, catéchèse et vie spirituelle depuis 1887.
          </p>
        </div>

        {COLS.map(col => (
          <div key={col.title}>
            <h4 style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>
              {col.title}
            </h4>
            {col.links.map(l => (
              <NavLink key={l.to} to={l.to}
                style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.55)', textDecoration: 'none', marginBottom: 10, transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent-light)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,.55)'}
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div style={{
        maxWidth: 'var(--max-w)', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 20, flexWrap: 'wrap', gap: 10,
      }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
          © {new Date().getFullYear()} Cathédrale Sacré-Cœur de Brazzaville
        </p>
        <span style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '.06em' }}>
          ✦ Informer, former, accompagner, rassembler ✦
        </span>
      </div>

      <style>{`
        .v2-footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 900px) {
          .v2-footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
        }
        @media (max-width: 500px) {
          .v2-footer-grid { grid-template-columns: 1fr; gap: 24px; }
        }
      `}</style>
    </footer>
  )
}
