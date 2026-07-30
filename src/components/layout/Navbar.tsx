import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const NAV = [
  { to: '/liturgie',        label: 'Liturgie' },
  { to: '/annonces',        label: 'Annonces' },
  { to: '/catechese',       label: 'Catéchèse' },
  { to: '/vie-spirituelle', label: 'Vie spirituelle' },
  { to: '/horaires',        label: 'Contact' },
]

export function Navbar() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.5s var(--ease-out-expo)',
        background: scrolled
          ? 'rgba(253,250,246,0.92)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201,151,59,0.15)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 32px rgba(13,11,9,0.08)' : 'none',
      }}
    >
      <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: scrolled ? 68 : 88, transition: 'height 0.5s var(--ease-out-expo)' }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Croix ornementale */}
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--crimson-700), var(--crimson-900))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: scrolled ? 'var(--shadow-md)' : '0 0 0 1px rgba(201,151,59,0.4)',
            transition: 'all 0.4s var(--ease-out-expo)',
            flexShrink: 0,
          }}>
            <span style={{ color: 'var(--gold-300)', fontSize: '1.1rem', lineHeight: 1 }}>✟</span>
          </div>
          <div>
            <p className="display" style={{ fontSize: '0.95rem', color: scrolled ? 'var(--crimson-800)' : 'white', lineHeight: 1.1, transition: 'color 0.4s' }}>
              Paroisse Saint Michel de la Base
            </p>
            <p className="label" style={{ color: scrolled ? 'var(--gold-500)' : 'rgba(232,192,122,0.85)', fontSize: '0.58rem', marginTop: 2 }}>
              Archidiocèse de Brazzaville
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden md:flex">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <span style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? 'white'
                    : scrolled ? 'var(--stone-600)' : 'rgba(255,255,255,0.85)',
                  background: isActive ? 'var(--crimson-700)' : 'transparent',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  position: 'relative',
                }}>
                  {label}
                  {!isActive && (
                    <span style={{
                      position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                      width: 0, height: 1.5, background: 'var(--gold-400)',
                      borderRadius: 2, transition: 'width 0.3s var(--ease-out-expo)',
                      display: 'block',
                    }} className="nav-underline" />
                  )}
                </span>
              )}
            </NavLink>
          ))}

          <Link to="/catechese" style={{
            marginLeft: '0.5rem',
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--gold-500), var(--gold-700))',
            color: 'white',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: 'var(--shadow-gold)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            S'inscrire
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="md:hidden"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: scrolled ? 'var(--crimson-700)' : 'white',
            padding: '0.5rem',
          }}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div style={{
        maxHeight: open ? 500 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s var(--ease-out-expo)',
        background: 'var(--ivory-light)',
        borderTop: open ? '1px solid var(--stone-200)' : 'none',
      }}>
        <nav style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <span style={{
                  display: 'block', padding: '0.75rem 1rem',
                  borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.9375rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--crimson-700)' : 'var(--stone-700)',
                  background: isActive ? 'var(--crimson-100)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--crimson-700)' : '3px solid transparent',
                }}>
                  {label}
                </span>
              )}
            </NavLink>
          ))}
          <Link to="/catechese" onClick={() => setOpen(false)} style={{
            marginTop: '0.75rem', display: 'block', textAlign: 'center',
            padding: '0.875rem', borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--gold-500), var(--gold-700))',
            color: 'white', fontWeight: 600, textDecoration: 'none',
          }}>
            S'inscrire à la catéchèse
          </Link>
        </nav>
      </div>

      <style>{`
        .nav-underline { width: 0 !important; }
        a:hover .nav-underline { width: calc(100% - 2rem) !important; }
      `}</style>
    </header>
  )
}
