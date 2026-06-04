import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TopBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 60,
      width: '100%',
      background: scrolled ? 'rgba(252,249,248,0.92)' : 'var(--surface)',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: '1px solid rgba(0,35,111,0.08)',
      transition: 'background 0.3s, box-shadow 0.3s',
      boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
    }}>
      <div style={{
        maxWidth: 720, margin: '0 auto',
        padding: '10px var(--margin)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo.png"
            alt="Logo Cathédrale"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(0,35,111,0.15)',
              boxShadow: '0 2px 8px rgba(0,35,111,0.12)',
            }}
          />
          <span className="text-headline-mobile" style={{ color: 'var(--primary)', letterSpacing: '-0.01em' }}>
            Archidiocèse de Brazzaville
          </span>
        </Link>
        <button style={{
          padding: 8, background: 'none', border: 'none',
          cursor: 'pointer', borderRadius: 'var(--r-full)',
          color: 'var(--on-surface-variant)',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <Bell size={22} />
        </button>
      </div>
    </header>
  )
}
