import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/',           icon: 'home',        label: 'Accueil'  },
  { to: '/liturgie',   icon: 'menu_book',   label: 'Liturgie' },
  { to: '/evenements', icon: 'live_tv',  label: 'Médias'  },
  { to: '/catechese',  icon: 'school',   label: 'Catéchèse' },
  { to: '/profil',     icon: 'person',   label: 'Profil'  },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <>
      {/* Spacer pour éviter que le contenu soit caché derrière la nav */}
      <div style={{ height: 80 }} />

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 50,
        height: 80,
        background: 'var(--surface)',
        borderTop: '1px solid rgba(115,92,0,0.15)',
        boxShadow: '0 -4px 20px rgba(0,35,111,0.08)',
        borderRadius: '16px 16px 0 0',
        display: 'flex', alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}>
        {TABS.map(({ to, icon, label }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', gap: 3,
                paddingTop: 8,
                height: '100%',
                color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderTop: isActive ? '2px solid var(--secondary)' : '2px solid transparent',
                transition: 'color 0.2s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 24,
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  transition: 'font-variation-settings 0.2s',
                }}
              >
                {icon}
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 10,
                fontWeight: 600, letterSpacing: '0.03em',
              }}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {/* FAB — Don */}
      <button style={{
        position: 'fixed', bottom: 90, right: 20,
        width: 52, height: 52,
        borderRadius: 'var(--r-full)',
        background: 'var(--secondary-container)',
        color: 'var(--on-secondary-container)',
        border: '2px solid white',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 40,
        transition: 'transform 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
        aria-label="Don & offrande"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
          volunteer_activism
        </span>
      </button>
    </>
  )
}
