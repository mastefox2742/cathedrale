import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'

const NAV = [
  { to: '/admin',             icon: 'dashboard',          label: 'Dashboard',   exact: true },
  { to: '/admin/annonces',    icon: 'campaign',           label: 'Annonces' },
  { to: '/admin/homelies',    icon: 'record_voice_over',  label: 'Homélies' },
  { to: '/admin/formations',  icon: 'school',             label: 'Formations' },
  { to: '/admin/evenements',  icon: 'live_tv',            label: 'Médias & Lives' },
  { to: '/admin/medias',      icon: 'perm_media',         label: 'Médiathèque' },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  redacteur: 'Rédacteur',
  catechiste: 'Catéchiste',
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa', fontFamily: 'var(--font-sans)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--primary)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                objectFit: 'cover', flexShrink: 0,
                border: '2px solid rgba(254,214,91,0.5)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            />
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>Sacré-Cœur</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Administration</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(({ to, icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                borderLeft: isActive ? '3px solid var(--secondary-container)' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profil + déconnexion */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {profile && (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>{profile.nom}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{ROLE_LABELS[profile.role] || profile.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(198,40,40,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
