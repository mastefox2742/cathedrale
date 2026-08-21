import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getAnnonces, type Annonce } from '../services/annonces'

const HISTOIRE = [
  { annee: '1887', texte: "Le père Hippolyte Carrié fonde la Mission du Saint-Esprit à Brazzaville." },
  { annee: '1894', texte: 'Consécration de la cathédrale, plus ancienne encore conservée en Afrique centrale.' },
  { annee: '1977', texte: 'Sépulture du cardinal Émile Biayenda, premier cardinal congolais.' },
  { annee: '1980', texte: 'Visite du pape Jean-Paul II à la cathédrale.' },
]

function getLiturgicalColor() {
  const m = new Date().getMonth() + 1, d = new Date().getDate()
  if ((m === 11 && d >= 27) || (m === 12 && d <= 24)) return { color: '#ce93d8', label: 'Avent', bg: 'rgba(106,27,154,.15)', border: 'rgba(106,27,154,.3)' }
  if (m === 12 && d >= 25) return { color: '#f0f0f0', label: 'Temps de Noël', bg: 'rgba(255,255,255,.08)', border: 'rgba(255,255,255,.2)' }
  if ((m === 2 && d >= 10) || (m === 3 && d <= 29)) return { color: '#ce93d8', label: 'Carême', bg: 'rgba(106,27,154,.15)', border: 'rgba(106,27,154,.3)' }
  if ((m === 3 && d >= 30) || m === 4 || (m === 5 && d <= 18)) return { color: '#f0f0f0', label: 'Temps pascal', bg: 'rgba(255,255,255,.08)', border: 'rgba(255,255,255,.2)' }
  return { color: '#6dbf67', label: 'Temps ordinaire', bg: 'rgba(46,125,50,.15)', border: 'rgba(46,125,50,.3)' }
}

export function HomePage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const heroBg = useRef<HTMLDivElement>(null)
  const coul = getLiturgicalColor()
  const now = new Date()

  useEffect(() => {
    getAnnonces().then(d => setAnnonces(d.slice(0, 3))).catch(() => {})
  }, [])

  useEffect(() => {
    const fn = () => { if (heroBg.current) heroBg.current.style.transform = `scale(1.06) translateY(${window.scrollY * .12}px)` }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', height: '100svh', minHeight: 600, display: 'flex', alignItems: 'center', overflow: 'hidden', width: '100%' }}>
        <div ref={heroBg} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('/cathedrale.jpg')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transform: 'scale(1.06)',
          willChange: 'transform',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(30,58,95,.88) 0%, rgba(30,58,95,.6) 55%, rgba(74,127,181,.3) 100%)' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 80% at 10% 70%, rgba(184,168,130,.15) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 'var(--max-w)', width: '100%', margin: '0 auto', padding: '0 var(--pad-x)' }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 28, height: 1, background: 'var(--accent-light)', display: 'inline-block' }} />
            Archidiocèse de Brazzaville · Congo
          </p>
          <h1 className="hero-title" style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(48px,8vw,90px)', fontWeight: 700, lineHeight: 1.05, color: '#fff', marginBottom: 8 }}>
            Cathédrale<br />
            <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Sacré-Cœur</em>
          </h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-mid)', maxWidth: 460, lineHeight: 1.8, marginBottom: 40 }}>
            Liturgie quotidienne, catéchèse et vie spirituelle au cœur de Brazzaville depuis 1887.
          </p>
          <div className="hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/liturgie" className="btn-gold">✝ Liturgie du jour</Link>
            <Link to="/annonces" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px', border: '1.5px solid rgba(255,255,255,.55)', color: '#fff', fontFamily: 'var(--v2-font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 'var(--r-sm)', transition: 'all .2s' }}>◉ Annonces</Link>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 }}>
          <span style={{ fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>Défiler</span>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(255,255,255,.6), transparent)', animation: 'scrollLine 1.8s ease infinite' }} />
        </div>
      </section>

      {/* ══ DEVISE ══ */}
      <div style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border-accent)', borderBottom: '1px solid var(--border-accent)', padding: '28px var(--pad-x)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(14px,2vw,19px)', fontStyle: 'italic', color: 'var(--primary)', letterSpacing: '.02em' }}>
          ✦ « Où laisserais-je ce peuple qui m'a été confié ? » ✦
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8, letterSpacing: '.05em' }}>
          Cardinal Émile Biayenda, 1977
        </p>
      </div>

      {/* ══ LITURGIE ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        <div className="inner grid-2" style={{ alignItems: 'center', gap: 'clamp(28px,5vw,72px)' }}>
          <div className="reveal">
            <span className="section-label">Liturgie</span>
            <p style={{ fontSize: 11, color: 'var(--accent-dark)', letterSpacing: '.12em', marginBottom: 10 }}>
              {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700, color: 'var(--text)', marginBottom: 16, lineHeight: 1.2 }}>
              Liturgie du Jour
            </h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 18, background: coul.bg, color: coul.color, border: `1px solid ${coul.border}` }}>
              ● {coul.label}
            </span>
            <blockquote style={{ fontFamily: 'var(--v2-font-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-mid)', lineHeight: 1.8, borderLeft: '3px solid var(--blue)', paddingLeft: 18, marginBottom: 26 }}>
              « Que votre lumière brille ainsi devant les hommes, afin qu'ils voient vos bonnes œuvres et glorifient votre Père qui est dans les cieux. »
              <small style={{ display: 'block', marginTop: 8, fontSize: 12, fontStyle: 'normal', color: 'var(--blue)' }}>— Matthieu 5:16</small>
            </blockquote>
            <Link to="/liturgie" className="btn-gold">Lire les lectures du jour</Link>
          </div>
          <div className="reveal" style={{ position: 'relative' }}>
            <img src="/cathedrale.jpg" alt="Cathédrale Sacré-Cœur de Brazzaville" style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', filter: 'brightness(.8) saturate(.75)' }} />
            <div style={{ position: 'absolute', inset: '-12px -12px auto auto', width: 100, height: 100, borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
            <div style={{ position: 'absolute', inset: 'auto auto -12px -12px', width: 100, height: 100, borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
          </div>
        </div>
      </section>

      {/* ══ VERSE ══ */}
      <div className="verse-band reveal">
        <blockquote>
          La foi vient de ce qu'on entend, et ce qu'on entend vient de la parole de Dieu.
          <cite className="verse-ref">Romains 10 : 17</cite>
        </blockquote>
      </div>

      {/* ══ ANNONCES ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)' }}>
        <div className="inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }} className="reveal">
            <div>
              <span className="section-label">Paroisse</span>
              <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>Annonces & Agenda</h2>
            </div>
            <Link to="/annonces" className="btn-outline" style={{ fontSize: 10, flexShrink: 0 }}>Tout voir →</Link>
          </div>

          {(annonces.length > 0 ? annonces : [
            { id: '1', date: '2026-06-08', titre: 'Grand-messe — Corpus Christi', desc: '10h30 · Procession eucharistique', tag: 'Liturgie' as const, epingle: true, publie: true },
            { id: '2', date: '2026-06-15', titre: 'Veillée de prière — Jeunes', desc: '20h00 · Crypte · Retransmis en direct', tag: 'Prière' as const, epingle: false, publie: true },
            { id: '3', date: '2026-06-29', titre: 'Fête des Saints Pierre et Paul', desc: '10h00 · Célébration pontificale', tag: 'Liturgie' as const, epingle: false, publie: true },
          ]).map((a, i) => {
            const d = new Date(a.date + 'T12:00:00')
            return (
              <div key={a.id || i} className="reveal" style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 20, alignItems: 'center', padding: '18px 0', borderBottom: '1px solid var(--border)', transition: 'padding-left .25s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.paddingLeft = '8px'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.paddingLeft = '0'}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 30, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{d.toLocaleDateString('fr-FR', { day: '2-digit' })}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>{d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</div>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{a.titre}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>{a.desc}</p>
                </div>
                <span style={{ padding: '4px 10px', background: 'rgba(74,127,181,.1)', border: '1px solid rgba(74,127,181,.2)', borderRadius: 'var(--r-full)', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: 'var(--blue)', whiteSpace: 'nowrap' }}>{a.tag}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══ CATÉCHISME ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        <div className="inner">
          <div className="reveal" style={{ maxWidth: 560, marginBottom: 48 }}>
            <span className="section-label">Formation</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>Parcours de Catéchèse</h2>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 12, lineHeight: 1.75 }}>Des parcours progressifs conçus et animés par l'équipe catéchétique de la cathédrale, adaptés à chaque tranche d'âge.</p>
          </div>
          <div className="grid-4">
            {[
              { emoji: '🌿', num: '01', name: 'Éveil à la Foi', tranche: '6 – 8 ans' },
              { emoji: '🍞', num: '02', name: '1ère Communion', tranche: '8 – 10 ans' },
              { emoji: '🔥', num: '03', name: 'Confirmation', tranche: '12 – 15 ans' },
              { emoji: '💧', num: '04', name: 'RICA — Adultes', tranche: 'Tout âge' },
            ].map((p, i) => (
              <Link key={i} to="/catechese" className="dark-card reveal" style={{
                padding: '28px 22px', textDecoration: 'none',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <span style={{ fontSize: 34 }}>{p.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', color: 'var(--accent-dark)', textTransform: 'uppercase' }}>Niveau {p.num}</span>
                <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{p.tranche}</span>
                <span style={{ fontSize: 18, color: 'var(--blue)', marginTop: 'auto' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HISTOIRE ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%)' }}>
        <div className="inner grid-2" style={{ alignItems: 'center', gap: 'clamp(28px,5vw,72px)' }}>
          <div className="reveal">
            <span className="section-label" style={{ color: 'var(--accent-light)' }}>Notre Identité</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Histoire de la Cathédrale</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: 14 }}>
              Depuis plus d'un siècle, la Cathédrale Sacré-Cœur est le cœur spirituel de Brazzaville et de l'Archidiocèse du Congo.
            </p>
            {HISTOIRE.map(h => (
              <div key={h.annee} style={{ display: 'flex', gap: 18, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--accent-light)', minWidth: 52 }}>{h.annee}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, paddingTop: 3 }}>{h.texte}</span>
              </div>
            ))}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/histoire" className="btn-gold">Notre histoire complète</Link>
            </div>
          </div>
          <div className="reveal" style={{ position: 'relative' }}>
            <img src="/cathedrale.jpg" alt="Histoire" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', filter: 'brightness(.75) saturate(.7)' }} />
            <div style={{ position: 'absolute', inset: 'auto -16px -16px auto', width: '55%', height: '45%', borderRight: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)' }} />
          </div>
        </div>
      </section>

      {/* ══ MÉDIAS HOME ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)' }}>
        <div className="inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }} className="reveal">
            <div>
              <span className="section-label">Médias</span>
              <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>Messes en Direct & Replays</h2>
            </div>
            <Link to="/evenements" className="btn-outline" style={{ fontSize: 10, flexShrink: 0 }}>Voir tout →</Link>
          </div>
          <div className="reveal grid-med">
            {[
              { img: '/cathedrale.jpg', plat: 'YouTube', platCls: '#FF0000', type: 'Replay · Messe', titre: 'Solennité de la Pentecôte — Messe Pontificale', date: 'Dim 25 mai 2026 · 10h30' },
              { img: '/hero-bg.jpg', plat: 'Facebook', platCls: '#1877F2', type: 'Replay · Événement', titre: 'Grande Veillée Pascale — Nuit Sainte', date: 'Sam 19 avr 2026 · 22h00' },
            ].map((m, i) => (
              <Link key={i} to="/evenements" className="dark-card" style={{ overflow: 'hidden', cursor: 'pointer', textDecoration: 'none' }}>
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                  <img src={m.img} alt={m.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.85)', transition: 'transform .5s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 52, height: 52, borderRadius: '50%', background: 'rgba(30,58,95,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
                    <svg viewBox="0 0 20 22" style={{ fill: 'white', width: 14, height: 16, marginLeft: 2 }}><path d="M2 1l16 10L2 21V1z"/></svg>
                  </div>
                  <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 9px', background: m.platCls, color: 'white', fontSize: 8, fontWeight: 700, letterSpacing: '.1em', borderRadius: 3 }}>{m.plat}</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', color: 'var(--accent-dark)', textTransform: 'uppercase', marginBottom: 7 }}>{m.type}</div>
                  <div style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>{m.titre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 7 }}>{m.date}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
