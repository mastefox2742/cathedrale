import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getServicesParoissiaux, type ServiceParoissial } from '../services/servicesParoissiaux'

const MESSES = [
  { jour: 'Lundi – Vendredi', horaires: ['07h00', '18h30'], accent: false },
  { jour: 'Samedi',           horaires: ['07h00', '10h00', '18h30'], accent: false },
  { jour: 'Dimanche',         horaires: ['07h00', '09h00', '11h00', '17h00'], accent: true },
]

const SACREMENTS = [
  { icon: '🤝', nom: 'Confessions', detail: 'Samedi 15h–17h · Dimanche 8h–9h45' },
  { icon: '💧', nom: 'Baptêmes', detail: '1er dimanche du mois — sur rendez-vous', demarche: true },
  { icon: '💍', nom: 'Mariages', detail: "Sur rendez-vous — 2 mois à l'avance minimum", demarche: true },
  { icon: '✋', nom: 'Onction des malades', detail: '1er vendredi du mois à 18h30' },
]

const CONTACTS = [
  { icon: '📍', label: 'Adresse', value: 'Avenue de la Paix, Centre-ville\nBrazzaville, République du Congo', href: 'https://maps.google.com/?q=Cathedrale+Sacre+Coeur+Brazzaville' },
  { icon: '📞', label: 'Téléphone', value: '+242 06 000 00 00', href: 'tel:+242060000000' },
  { icon: '✉️', label: 'Email', value: 'contact@sacrecoeur-brazza.cg', href: 'mailto:contact@sacrecoeur-brazza.cg' },
  { icon: '💬', label: 'WhatsApp', value: '+242 06 000 00 01', href: 'https://wa.me/242060000001' },
]

function contactHref(contact: string) {
  return contact.includes('@') ? `mailto:${contact}` : `tel:${contact.replace(/\s/g, '')}`
}

export function HorairesPage() {
  const [services, setServices] = useState<ServiceParoissial[]>([])
  const [loadingServices, setLoadingServices] = useState(true)

  useEffect(() => {
    getServicesParoissiaux().then(setServices).catch(() => setServices([])).finally(() => setLoadingServices(false))
  }, [])

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Informations pratiques</p>
          <h1>Horaires <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>&amp; Contact</em></h1>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner" style={{ maxWidth: 860 }}>

          <div className="reveal" style={{ marginBottom: 40 }}>
            <span className="section-label">Horaires des Messes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'var(--space-xl)' }}>
            {MESSES.map((m, i) => (
              <div key={i} className="reveal" style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '22px 28px',
                background: 'var(--surface)', border: `1px solid ${m.accent ? 'rgba(193,164,97,.2)' : 'rgba(193,164,97,.07)'}`,
                transition: 'background .2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-alt)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
              >
                <div style={{ width: 4, height: 48, background: m.accent ? 'var(--gold)' : 'var(--gold-dark)', borderRadius: 2, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{m.jour}</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {m.horaires.map(h => (
                    <span key={h} style={{ padding: '5px 14px', border: `1px solid ${m.accent ? 'rgba(193,164,97,.4)' : 'rgba(193,164,97,.2)'}`, color: m.accent ? 'var(--gold)' : 'var(--grey)', fontFamily: 'var(--v2-font-sans)', fontSize: 13, fontWeight: 600, letterSpacing: '.04em' }}>{h}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ marginBottom: 28 }}>
            <span className="section-label">Sacrements</span>
          </div>
          <div className="sacrement-grid-resp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(193,164,97,.07)', marginBottom: 'var(--space-xl)' }}>
            {SACREMENTS.map((s, i) => (
              <div key={i} className="reveal" style={{ background: 'var(--surface)', padding: '28px 24px', display: 'flex', gap: 16, alignItems: 'flex-start', transition: 'background .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-alt)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
              >
                <div style={{ width: 44, height: 44, border: '1px solid rgba(193,164,97,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.nom}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300 }}>{s.detail}</p>
                  {s.demarche && (
                    <Link to="/demarches" style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--gold)', textDecoration: 'underline' }}>
                      Faire une demande →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ marginBottom: 28 }}>
            <span className="section-label">Services paroissiaux</span>
          </div>
          {loadingServices ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 'var(--space-xl)' }}>Chargement…</p>
          ) : services.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 'var(--space-xl)' }}>Le répertoire des services sera bientôt disponible.</p>
          ) : (
            <div className="sacrement-grid-resp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(193,164,97,.07)', marginBottom: 'var(--space-xl)' }}>
              {services.map(s => (
                <div key={s.id} className="reveal" style={{ background: 'var(--surface)', padding: '28px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, border: '1px solid rgba(193,164,97,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.emoji}</div>
                  <div>
                    <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 4 }}>{s.categorie}</span>
                    <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.nom}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300, lineHeight: 1.6 }}>{s.description}</p>
                    {s.horaire && <p style={{ fontSize: 12, color: 'var(--accent-dark)', fontWeight: 600, marginTop: 6 }}>{s.horaire}</p>}
                    {s.contact && (
                      <a href={contactHref(s.contact)} style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 700, color: 'var(--gold)', textDecoration: 'underline' }}>
                        Contacter →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="reveal" style={{ marginBottom: 28 }}>
            <span className="section-label">Informations pratiques</span>
          </div>
          <div className="contact-grid-resp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(193,164,97,.06)', marginBottom: 'var(--space-xl)' }}>
            {CONTACTS.map((c, i) => (
              <div key={i} className="reveal" style={{ background: 'var(--bg-alt)', padding: '28px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{c.icon}</div>
                <div>
                  <h4 style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 6 }}>{c.label}</h4>
                  <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                    style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 15, color: 'var(--text)', textDecoration: 'none', whiteSpace: 'pre-line', lineHeight: 1.5, transition: 'color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
                  >{c.value}</a>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, color: 'var(--text-light)', textAlign: 'center' }}>Avenue de la Paix, Centre-ville, Brazzaville</p>
            <a href="https://maps.google.com/?q=Cathedrale+Sacre+Coeur+Brazzaville" target="_blank" rel="noopener noreferrer" className="btn-outline">
              ↗ Ouvrir dans Google Maps
            </a>
          </div>

        </div>
      </div>
    </>
  )
}
