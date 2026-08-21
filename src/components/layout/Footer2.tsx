import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/horaires', label: 'Horaires des Messes' },
  { to: '/histoire', label: 'Histoire & Archives' },
  { to: '/catechese', label: 'Catéchèse' },
  { to: '/dons', label: 'Faire un Don', accent: true },
  { to: '/connexion', label: 'Espace Membre' },
  { to: '/signaler', label: 'Signaler une préoccupation' },
]

export function Footer2() {
  return (
    <footer style={{
      width: '100%', padding: 'var(--space-xl) var(--pad-x)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      background: 'var(--bg-alt)', borderTop: '1px solid var(--border-accent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--accent)', overflow: 'hidden' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
          Sacré-Cœur Brazzaville
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-mid)', maxWidth: 560, lineHeight: 1.8, marginBottom: 32 }}>
        Cathédrale Primatiale de l'Archidiocèse de Brazzaville — érigée en 1887. Siège de
        l'archevêché métropolitain, lieu de prière, de mémoire et de vie spirituelle.
      </p>

      <ul style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 32px', listStyle: 'none', margin: '0 0 36px', padding: 0 }}>
        {LINKS.map(l => (
          <li key={l.to}>
            <NavLink to={l.to} end={l.to === '/'}
              style={{
                fontSize: 13, fontWeight: l.accent ? 700 : 400, color: l.accent ? 'var(--primary)' : 'var(--text-mid)',
                textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color .2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = l.accent ? 'var(--primary)' : 'var(--text-mid)'}
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div style={{ fontSize: 11, color: 'var(--text-light)', lineHeight: 1.7 }}>
        <div>Avenue de la Paix, Centre-ville, Brazzaville, République du Congo</div>
        <div>© {new Date().getFullYear()} Cathédrale Sacré-Cœur de Brazzaville. Tous droits réservés.</div>
      </div>
    </footer>
  )
}
