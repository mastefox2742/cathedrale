import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

const LINKS = [
  ['/', 'Accueil'],
  ['/liturgie', 'Liturgie du jour'],
  ['/annonces', 'Annonces & Agenda'],
  ['/catechese', 'Catéchèse'],
  ['/vie-spirituelle', 'Vie spirituelle'],
  ['/horaires', 'Horaires & Contact'],
]

export function Footer() {
  return (
    <footer style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Bande d'or supérieure */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, var(--gold-500) 20%, var(--gold-300) 50%, var(--gold-500) 80%, transparent 100%)' }} />

      <div style={{
        background: 'linear-gradient(160deg, var(--crimson-950) 0%, var(--earth-900) 60%, var(--crimson-950) 100%)',
        padding: '5rem 1.5rem 2rem',
        position: 'relative',
      }}>
        {/* Motif de fond */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M27 0h6v27h27v6H33v27h-6V33H0v-6h27z' fill='%23C9973B' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>

            {/* Identité */}
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--gold-500), var(--gold-700))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-gold)',
                  flexShrink: 0,
                }}>
                  <span style={{ color: 'white', fontSize: '1.125rem' }}>✟</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: '0.975rem', lineHeight: 1.2 }}>
                    Paroisse Saint Michel de la Base
                  </p>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-400)', marginTop: 2 }}>
                    Brazzaville · Congo
                  </p>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-prose)', fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75 }}>
                Maison de Dieu ouverte à tous. Prière, liturgie, formation et fraternité au cœur de Brazzaville.
              </p>

              {/* Citation */}
              <div style={{
                marginTop: '1.5rem',
                paddingLeft: '1rem',
                borderLeft: '2px solid rgba(201,151,59,0.4)',
              }}>
                <p style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', color: 'rgba(255,255,255,0.45)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  « Je suis le chemin, la vérité et la vie. »
                </p>
                <cite style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--gold-500)', fontStyle: 'normal' }}>Jean 14, 6</cite>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '1.25rem' }}>
                Navigation
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {LINKS.map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} style={{
                      fontFamily: 'var(--font-ui)', fontSize: '0.9375rem',
                      color: 'rgba(255,255,255,0.55)',
                      textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      transition: 'color 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-300)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                    >
                      <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--gold-600)', flexShrink: 0 }} />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Horaires rapides */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '1.25rem' }}>
                Messes
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { j: 'Lun – Sam', h: '07h00 · 18h30' },
                  { j: 'Dimanche', h: '07h · 09h · 11h · 17h' },
                ].map(({ j, h }) => (
                  <div key={j} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <Clock size={13} style={{ color: 'var(--gold-500)', marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{j}</p>
                      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>{h}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '1.25rem' }}>
                Contact
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { icon: MapPin, text: 'Avenue de la Paix, Brazzaville, République du Congo' },
                  { icon: Phone, text: '+242 06 000 00 00' },
                  { icon: Mail, text: 'contact@sacrecoeur-brazza.cg' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                    <Icon size={13} style={{ color: 'var(--gold-500)', marginTop: 3, flexShrink: 0 }} />
                    <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bas de page */}
          <div style={{
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)' }}>
              © {new Date().getFullYear()} Paroisse Saint Michel de la Base — Tous droits réservés
            </p>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.18)' }}>
              Développé avec ✟ par Alpha-tech
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
