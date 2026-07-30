import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'

const VERSET = {
  texte: '« Venez à moi, vous tous qui peinez et ployez sous le fardeau, et moi je vous donnerai le repos. »',
  ref: 'Matthieu 11, 28',
}

const LITURGY_CARDS = [
  { tag: 'Première Lecture', ref: 'Élie (1 R 19)', excerpt: '« L\'ange du Seigneur revint, le toucha et dit : Lève-toi et mange ! Autrement le chemin serait trop long pour toi. »', stripe: '#2e7d32' },
  { tag: 'Psaume', ref: 'Psaume 33', excerpt: '« Goûtez et voyez comme est bon le Seigneur. Heureux qui trouve en lui son refuge ! »', stripe: '#2e7d32' },
  { tag: 'Évangile', ref: 'Jean 6, 41-51', excerpt: '« Je suis le pain vivant, descendu du ciel. Celui qui mangera de ce pain vivra éternellement. »', stripe: '#2e7d32' },
]

const QUICK_ACCESS = [
  { icon: 'live_tv',          label: 'Messe Live',  to: '/liturgie' },
  { icon: 'self_improvement', label: 'Confession',  to: '/horaires' },
  { icon: 'location_on',      label: 'Paroisses',   to: '/horaires' },
]

const ANNONCES = [
  { id: 1, titre: 'Messe Solennelle — Fête du Sacré-Cœur', date: '27 Juin', tag: 'Liturgie', icon: 'church' },
  { id: 2, titre: 'Inscriptions catéchisme 2026-2027 ouvertes', date: '10 Juin', tag: 'Formation', icon: 'school' },
  { id: 3, titre: 'Retraite spirituelle du Carême', date: '15 Juin', tag: 'Événement', icon: 'self_improvement' },
]

const SECTIONS = [
  { icon: 'menu_book',    label: 'Liturgie du jour',   desc: 'Lectures & Évangile',         to: '/liturgie',        bg: 'var(--primary-container)' },
  { icon: 'campaign',     label: 'Annonces',           desc: 'Agenda & célébrations',        to: '/annonces',        bg: 'var(--secondary)' },
  { icon: 'school',       label: 'Catéchèse',          desc: 'Formation & parcours de foi',  to: '/catechese',       bg: '#2e7d32' },
  { icon: 'auto_stories', label: 'Formation',          desc: 'Académie des laïcs',           to: '/vie-spirituelle', bg: '#7b1fa2' },
]

export function HomePage() {
  const [installDismissed, setInstallDismissed] = useState(false)

  return (
    <div className="page-content" style={{ padding: 0 }}>

      {/* ── Mobile: padding standard | Desktop: géré par page-content ── */}
      <div style={{ padding: 'var(--space-md) var(--margin) 0' }} className="mobile-pad">

        {/* PWA Banner */}
        {!installDismissed && (
          <div className="animate-slide-up" style={{
            marginBottom: 'var(--space-sm)',
            padding: '10px var(--space-sm)',
            background: 'var(--primary-container)', color: 'white',
            borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)', fontSize: 22, fontVariationSettings: "'FILL' 1" }}>install_mobile</span>
              <span className="text-label-md" style={{ color: 'white' }}>Installer l'application sur votre écran</span>
            </div>
            <button onClick={() => setInstallDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* ── Hero photo cathédrale ── */}
        <div
          className="hero-banner"
          style={{
            position: 'relative', height: 260,
            borderRadius: 'var(--r-xl)', overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <img
            src="/cathedrale.jpg"
            alt="Paroisse Saint Michel de la Base"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.7s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)')}
            onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,35,111,0.88) 0%, rgba(0,35,111,0.3) 55%, transparent 100%)' }} />
          {/* Bande d'or */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #D4AF37, #f0d060, #D4AF37)' }} />
          <div style={{ position: 'absolute', bottom: 0, padding: 'var(--space-md)' }}>
            <span style={{ display: 'inline-block', marginBottom: 6, background: 'var(--secondary)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Actualité
            </span>
            <h2 className="text-headline-mobile" style={{ color: 'white', marginBottom: 4 }}>
              Messe Solennelle à la Cathédrale
            </h2>
            <p className="text-body-md" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Célébration présidée par Monseigneur l'Archevêque ce dimanche à 10h.
            </p>
          </div>
        </div>

        {/* ── Devise liturgique ── */}
        <div className="animate-slide-up" style={{
          marginBottom: 'var(--space-md)',
          padding: '14px 20px',
          background: 'linear-gradient(135deg, var(--primary) 0%, #1a3a9a 100%)',
          borderRadius: 'var(--r-xl)',
          borderTop: '3px solid #D4AF37',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 14, flexWrap: 'wrap',
          boxShadow: '0 4px 20px rgba(0,35,111,0.2)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -16, top: -16, opacity: 0.06, pointerEvents: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 100, color: 'white' }}>auto_awesome</span>
          </div>
          <span style={{ color: '#D4AF37', fontSize: 18, flexShrink: 0 }}>✦</span>
          <p style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'white', letterSpacing: '0.04em',
            textAlign: 'center', lineHeight: 1.4,
          }}>
            Sumus corpus Christi,{' '}
            <span style={{ color: '#D4AF37', fontStyle: 'normal', fontWeight: 600 }}>unum corpus</span>
          </p>
          <span style={{ color: '#D4AF37', fontSize: 18, flexShrink: 0 }}>✦</span>
        </div>

        {/* ── Verset (desktop uniquement) ── */}
        <div className="desktop-verset" style={{ display: 'none', marginBottom: 'var(--space-lg)' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,35,111,0.04), rgba(0,35,111,0.08))',
            border: '1px solid rgba(0,35,111,0.1)',
            borderRadius: 'var(--r-xl)', padding: '24px 28px',
            borderLeft: '4px solid var(--secondary)',
          }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: 12 }}>
              ✦ Verset du jour
            </p>
            <blockquote className="text-body-lg" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--on-surface)', lineHeight: 1.75 }}>
              {VERSET.texte}
            </blockquote>
            <cite style={{ display: 'block', marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--secondary)', fontStyle: 'normal', fontWeight: 600 }}>
              — {VERSET.ref}
            </cite>
          </div>
        </div>

        {/* ── Accès rapide ── */}
        <div
          className="desktop-grid-3"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 'var(--space-lg)' }}
        >
          {QUICK_ACCESS.map(({ icon, label, to }) => (
            <Link key={to + label} to={to} className="tap-none" style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: 'var(--space-sm)',
                gap: 6, cursor: 'pointer',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 28 }}>{icon}</span>
                <span className="text-label-md" style={{ color: 'var(--primary)', textAlign: 'center' }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Grille 2 colonnes desktop : Lectures + Annonces ── */}
        <div className="desktop-two-col" style={{ display: 'block' }}>

          {/* Lectures du jour */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <h3 className="text-title-md" style={{ color: 'var(--primary)' }}>Lectures du Jour</h3>
              <span className="text-label-sm" style={{ color: 'var(--secondary)' }}>Temps Ordinaire</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--space-lg)' }}>
              {LITURGY_CARDS.map((c, i) => (
                <Link key={i} to="/liturgie" className="tap-none" style={{ textDecoration: 'none' }}>
                  <div className={`card animate-slide-up delay-${i + 1}`} style={{ padding: 'var(--space-md)', opacity: i > 0 ? 0.85 : 1 }}>
                    <div className="liturgical-stripe" style={{ background: c.stripe }} />
                    <div style={{ paddingLeft: 12 }}>
                      <p className="text-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 4 }}>{c.tag}</p>
                      <h4 className="text-headline-mobile" style={{ color: 'var(--primary)', fontSize: 18, lineHeight: '1.3' }}>{c.ref}</h4>
                      {i === 0 && (
                        <p className="text-body-md" style={{ color: 'var(--on-surface)', marginTop: 8, fontStyle: 'italic', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {c.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Annonces */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <h3 className="text-title-md" style={{ color: 'var(--primary)' }}>Annonces</h3>
              <Link to="/annonces" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--secondary)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Tout voir <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-lg)' }}>
              {ANNONCES.map((a, i) => (
                <div key={a.id} className={`card animate-slide-up delay-${i + 1}`} style={{ padding: '14px var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--r-full)', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>{a.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-label-md" style={{ color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titre}</p>
                    <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 2 }}>{a.date} · {a.tag}</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20, flexShrink: 0 }}>chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sections rapides desktop ── */}
        <div className="desktop-sections-grid" style={{ display: 'none', marginBottom: 'var(--space-lg)' }}>
          <h3 className="text-title-md" style={{ color: 'var(--primary)', marginBottom: 'var(--space-sm)' }}>Nos services</h3>
          <div className="desktop-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {SECTIONS.map(({ icon, label, desc, to, bg }) => (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  padding: '20px 18px', cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--r-lg)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 17, color: 'var(--on-surface)', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Réflexion du jour ── */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card" style={{
            background: 'var(--primary)', padding: 'var(--space-lg)',
            borderRadius: 'var(--r-xl)', position: 'relative', overflow: 'hidden',
            borderTop: '3px solid #D4AF37',
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                <h3 className="text-title-md" style={{ color: 'white' }}>Réflexion du Jour</h3>
              </div>
              <p className="text-headline-mobile" style={{ color: 'var(--secondary-container)', lineHeight: 1.45, marginBottom: 'var(--space-md)', fontStyle: 'italic' }}>
                « La prière est le souffle de l'âme, elle nous permet d'écouter le silence de Dieu. »
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-full)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--secondary-container)', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)', fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <div>
                  <p className="text-label-md" style={{ color: 'white' }}>Abbé Pierre N.</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Aumônier diocésain</p>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.08 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 140 }}>auto_awesome</span>
            </div>
          </div>
        </div>

        {/* ── Histoire de la Paroisse ── */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>history_edu</span>
            <h3 className="text-title-md" style={{ color: 'var(--primary)' }}>Notre Histoire</h3>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Bande liturgique */}
            <div style={{ height: 4, background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />

            <div style={{ padding: 'var(--space-md)' }}>
              {/* Années en médaillon */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-md)', overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
                {[
                  { annee: '1892', label: 'Fondation' },
                  { annee: '1930', label: 'Consécration' },
                  { annee: '1961', label: 'Diocèse' },
                  { annee: '1995', label: 'Archidiocèse' },
                ].map(({ annee, label }) => (
                  <div key={annee} style={{
                    flex: '0 0 auto', textAlign: 'center',
                    padding: '10px 16px', borderRadius: 'var(--r-lg)',
                    background: 'var(--surface-container)',
                    border: '1px solid rgba(0,35,111,0.08)',
                  }}>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{annee}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Texte court */}
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.85, color: 'var(--on-surface)', marginBottom: 14 }}>
                Fondée en <strong>1892</strong> par les Pères du Saint-Esprit, la Paroisse Saint Michel de la Base
                est l'une des plus anciennes églises d'Afrique centrale. Consacrée en <strong>1930</strong>, elle
                est devenue cathédrale lors de la création du diocèse de Brazzaville en <strong>1961</strong>,
                puis siège de l'Archidiocèse en <strong>1995</strong>.
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.8, color: 'var(--on-surface-variant)' }}>
                Témoin de l'histoire du Congo, elle accueille chaque semaine des milliers de fidèles venus de toutes
                les paroisses de Brazzaville, portant dans sa pierre le souffle de plus d'un siècle de foi congolaise.
              </p>

              {/* Lien vers histoire complète */}
              <button style={{
                marginTop: 'var(--space-md)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--primary)', fontWeight: 700, fontSize: 14,
                fontFamily: 'var(--font-sans)',
                padding: '8px 0',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_stories</span>
                Lire l'histoire complète
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(115,92,0,0.08)', borderRadius: 'var(--r-xl)', border: '1px solid rgba(115,92,0,0.18)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 32, marginTop: 2, fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
            <div style={{ flex: 1 }}>
              <h3 className="text-title-md" style={{ color: 'var(--on-surface)', marginBottom: 6, fontSize: 18 }}>Restez en Prière</h3>
              <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-md)', fontSize: 15 }}>
                Recevez les rappels pour l'Angélus et les alertes de l'Évêché directement sur votre téléphone.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Rappels de Prière', 'Nouvelles de l\'Archidiocèse'].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(117,118,130,0.12)', cursor: 'pointer' }}>
                    <span className="text-label-md" style={{ color: 'var(--on-surface)' }}>{item}</span>
                    <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Styles desktop inline */}
      <style>{`
        @media (min-width: 1024px) {
          .mobile-pad { padding: 40px 0 0 !important; }
          .page-content { padding: 0 !important; max-width: none !important; }
          .desktop-layout main { padding: 0 56px; }

          .desktop-two-col {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            align-items: start;
          }
          .desktop-verset     { display: block !important; }
          .desktop-sections-grid { display: block !important; }

          .hero-banner { height: 400px !important; border-radius: 20px !important; }

          .text-headline-mobile { font-size: 32px !important; line-height: 40px !important; }
          .text-title-md { font-size: 24px !important; }

          .card { border-radius: 14px; }
        }
      `}</style>
    </div>
  )
}
