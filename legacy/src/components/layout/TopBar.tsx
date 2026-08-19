import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function TopBar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pressing, setPressing] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  function startPress() {
    setPressing(true)
    pressTimer.current = setTimeout(() => {
      navigate('/admin')
    }, 3000)
  }

  function endPress() {
    setPressing(false)
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

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
          {/* Logo — maintenir appuyé 3s pour accéder à l'admin */}
          <div
            onMouseDown={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            title="Maintenir appuyé 3s pour accéder à l'administration"
          >
            <img
              src="/logo.png"
              alt="Logo Cathédrale"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                objectFit: 'cover',
                border: pressing ? '2px solid var(--primary)' : '2px solid rgba(0,35,111,0.15)',
                boxShadow: pressing ? '0 0 0 4px rgba(0,35,111,0.15)' : '0 2px 8px rgba(0,35,111,0.12)',
                transition: 'all 0.2s',
              }}
            />
            {pressing && (
              <svg
                style={{ position: 'absolute', inset: -4, width: 44, height: 44, transform: 'rotate(-90deg)' }}
                viewBox="0 0 44 44"
              >
                <circle
                  cx="22" cy="22" r="20"
                  fill="none" stroke="var(--primary)" strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset="0"
                  style={{ animation: 'admin-ring 3s linear forwards' }}
                />
              </svg>
            )}
          </div>
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
      <style>{`
        @keyframes admin-ring {
          from { stroke-dashoffset: ${2 * Math.PI * 20}; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </header>
  )
}
