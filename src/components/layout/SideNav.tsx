import { NavLink, Link, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/',                icon: 'home',         label: 'Accueil' },
  { to: '/liturgie',        icon: 'menu_book',    label: 'Liturgie du jour' },
  { to: '/annonces',        icon: 'campaign',     label: 'Annonces & Agenda' },
  { to: '/evenements',      icon: 'live_tv',      label: 'Médias & Lives' },
  { to: '/catechese',       icon: 'school',       label: 'Catéchèse' },
  { to: '/vie-spirituelle', icon: 'self_improvement', label: 'Formation' },
  { to: '/horaires',        icon: 'location_on',  label: 'Horaires & Contact' },
  { to: '/profil',          icon: 'person',       label: 'Mon profil' },
]

export function SideNav() {
  const { pathname } = useLocation()

  return (
    <aside style={{
      width: 280,
      minHeight: '100dvh',
      background: 'white',
      borderRight: '1px solid rgba(0,35,111,0.08)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100dvh',
      flexShrink: 0,
      boxShadow: '2px 0 12px rgba(0,35,111,0.04)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 24px 20px',
        borderBottom: '1px solid rgba(0,35,111,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <img
            src="/logo.png"
            alt="Logo Cathédrale Sacré-Cœur"
            style={{
              width: 48, height: 48, borderRadius: '50%',
              objectFit: 'cover', flexShrink: 0,
              border: '2px solid rgba(0,35,111,0.18)',
              boxShadow: '0 4px 12px rgba(0,35,111,0.2)',
            }}
          />
          <div>
            <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 16, color: 'var(--primary)', lineHeight: 1.2 }}>
              Cathédrale<br />Sacré-Cœur
            </p>
          </div>
        </div>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--secondary)', paddingLeft: 56,
        }}>
          Archidiocèse de Brazzaville
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--on-surface-variant)', padding: '0 12px', marginBottom: 8,
        }}>
          Navigation
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 'var(--r-lg)',
                  background: isActive ? 'rgba(0,35,111,0.08)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                  fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  borderLeft: isActive ? '3px solid var(--secondary)' : '3px solid transparent',
                }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-container)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0", flexShrink: 0 }}
                  >
                    {icon}
                  </span>
                  {label}
                </div>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Footer sidebar */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(0,35,111,0.06)',
      }}>
        {/* FAB Don */}
        <button style={{
          width: '100%', padding: '12px',
          borderRadius: 'var(--r-lg)', border: 'none',
          background: 'linear-gradient(135deg, var(--secondary-container), #e9c343)',
          color: 'var(--on-secondary-container)',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 12px rgba(115,92,0,0.2)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(115,92,0,0.3)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(115,92,0,0.2)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
          Don & Offrande
        </button>
        <Link
          to="/admin"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            fontSize: 12, color: 'var(--outline)', textDecoration: 'none',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary)'; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-container)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--outline)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>admin_panel_settings</span>
          Administration
        </Link>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--outline)', marginTop: 8 }}>
          © {new Date().getFullYear()} Archidiocèse de Brazzaville
        </p>
      </div>
    </aside>
  )
}
