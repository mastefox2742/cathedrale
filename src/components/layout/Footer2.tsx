import { NavLink } from '../../lib/navigation'
import { SITE } from '../../config/site'

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/horaires', label: 'Horaires des Messes' },
  { to: '/paroisses', label: 'Paroisses' },
  { to: '/tv', label: 'Médiation / TV' },
  { to: '/prier', label: 'Prier' },
  { to: '/histoire', label: 'Histoire & Archives' },
  { to: '/catechese', label: 'Catéchèse' },
  { to: '/dons', label: 'Faire un Don', accent: true },
  { to: '/connexion', label: 'Espace Membre' },
  { to: '/histoire-archidiocese', label: "L'archidiocèse" },
  { to: '/chartes/media', label: 'Charte média' },
  { to: '/chartes/protection-mineurs', label: 'Protection des mineurs' },
  { to: '/signaler', label: 'Signaler une préoccupation' },
  { to: '/confidentialite', label: 'Confidentialité' },
]

export function Footer2() {
  return (
    <footer style={{
      width: '100%', padding: 'var(--space-xl) var(--pad-x)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      background: 'var(--bg-alt)', borderTop: '1px solid var(--border-accent)',
    }}>
      <div style={{ marginBottom: 22, padding: '14px 18px', background: '#fff', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-sm)' }}>
        <img src="/logo-archidiocese.png" alt={SITE.nom} width={140} height={134} style={{ display: 'block', width: 140, height: 'auto' }} />
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-mid)', maxWidth: 560, lineHeight: 1.8, marginBottom: 32 }}>
        Évangélisation, médiation, catéchèse et vie des paroisses de l'Archidiocèse de
        Brazzaville, autour de la Cathédrale Sacré-Cœur, son église mère depuis 1887.
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
        <div>Archevêché · Avenue de la Paix, Centre-ville, Brazzaville, République du Congo</div>
        <div>© {new Date().getFullYear()} {SITE.nom}. Tous droits réservés.</div>
      </div>
    </footer>
  )
}
