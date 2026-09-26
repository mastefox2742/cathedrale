'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Clock, HeartHandshake, Radio, ArrowRight, HandHeart, Compass, Droplets, BookOpen, Flame, CalendarClock } from 'lucide-react'
import { getAnnonces, type Annonce } from '../services/annonces'
import { getProjetsDons, formatXAF, type ProjetDon } from '../services/dons'
import { getALaUne, type Evenement } from '../services/evenements'
import { getDirectsAVenir, type Direct } from '../services/mediation'
import { useParoisse } from '../contexts/ParoisseContext'
import { VideoCard } from '../components/VideoCard'
import { getArchidiocese, type Archidiocese } from '../services/archidiocese'

const QUICK_ACCESS = [
  { icon: Clock, titre: 'Horaires & Messes', desc: "Consultez les horaires des offices et l'agenda liturgique de la semaine.", to: '/horaires', bg: 'var(--primary)', fg: '#fff' },
  { icon: HeartHandshake, titre: 'Intentions de prière', desc: 'Confiez vos intentions aux prêtres et à la communauté de la cathédrale.', to: '/vie-spirituelle', bg: 'var(--primary-mid)', fg: '#fff' },
  { icon: Radio, titre: 'Homélies & Enseignements', desc: "Réécoutez les homélies dominicales pour nourrir votre chemin spirituel.", to: '/homelies', bg: 'var(--accent)', fg: 'var(--text)' },
]

/** Les quatre portes d'entrée de la plateforme (évangélisation). */
const PORTES = [
  { icon: Compass, titre: 'Je découvre la foi', desc: 'Pour les curieux et ceux qui cherchent : qui est Jésus, pourquoi prier, que croient les chrétiens ?', to: '/decouvrir-la-foi' },
  { icon: Droplets, titre: 'Je veux me convertir', desc: 'Devenir chrétien : les étapes du catéchuménat, des témoignages et un accompagnement.', to: '/se-convertir' },
  { icon: BookOpen, titre: 'Je veux approfondir ma foi', desc: 'Bible, doctrine, vie spirituelle : des parcours pour les baptisés qui veulent grandir.', to: '/approfondir' },
  { icon: Flame, titre: 'Je veux prier', desc: "Évangile du jour, liturgie des heures, chapelet, mur de prière et neuvaines.", to: '/prier' },
]

const HISTOIRE = [
  { annee: '1887', titre: 'Fondation de la mission', texte: "Le père Hippolyte Carrié fonde la Mission du Saint-Esprit à Brazzaville." },
  { annee: '1892', titre: 'Première pierre', texte: "Le père Prosper Augouard pose la première pierre de l'édifice." },
  { annee: '1894', titre: 'Consécration', texte: "La cathédrale est consacrée, plus ancienne encore conservée en Afrique centrale." },
  { annee: '1977', titre: 'Sépulture du Cardinal Biayenda', texte: 'Sépulture du cardinal Émile Biayenda, premier cardinal congolais.' },
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
  const [projets, setProjets] = useState<ProjetDon[]>([])
  const [aLaUne, setALaUne] = useState<Evenement[]>([])
  const [prochainDirect, setProchainDirect] = useState<Direct | null>(null)
  const { courante } = useParoisse()
  const [archidiocese, setArchidiocese] = useState<Archidiocese | null>(null)

  // Horaires des messes de la paroisse choisie : ceux du jour, sinon le dimanche.
  const jourCourant = new Date().toLocaleDateString('fr-FR', { weekday: 'long' })
  const messes = courante?.horaires.messes ?? []
  const messesDuJour = messes.find(m => m.jour.toLowerCase().includes(jourCourant))
    ?? messes.find(m => /lundi\s*[–-]\s*vendredi/i.test(m.jour) && ![0, 6].includes(new Date().getDay()))
    ?? messes.find(m => /dimanche/i.test(m.jour))
  const heroBg = useRef<HTMLDivElement>(null)
  const coul = getLiturgicalColor()
  const now = new Date()

  useEffect(() => {
    getAnnonces().then(d => setAnnonces(d.slice(0, 3))).catch(() => {})
    getProjetsDons().then(d => setProjets(d.slice(0, 3))).catch(() => setProjets([]))
    getALaUne(2).then(setALaUne).catch(() => setALaUne([]))
    getDirectsAVenir().then(d => setProchainDirect(d[0] ?? null)).catch(() => setProchainDirect(null))
    getArchidiocese().then(setArchidiocese).catch(() => setArchidiocese(null))
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
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(18,59,93,.88) 0%, rgba(18,59,93,.6) 55%, rgba(62,124,177,.3) 100%)' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 80% at 10% 70%, rgba(201,162,39,.15) 0%, transparent 70%)' }} />

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
          <div className="hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 720 }}>
            {PORTES.map((p, i) => (
              <Link key={p.to} href={p.to} className={i === 0 ? 'btn-gold' : undefined} style={i === 0 ? undefined : { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', border: '1.5px solid rgba(255,255,255,.55)', color: '#fff', fontFamily: 'var(--v2-font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 'var(--r-md)', transition: 'all .2s' }}>
                <p.icon size={14} /> {p.titre}
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 18 }}>
            <Link href="/liturgie" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-light)', textDecoration: 'none' }}>✝ Liturgie du jour →</Link>
          </p>
        </div>

        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 }}>
          <span style={{ fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>Défiler</span>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(255,255,255,.6), transparent)', animation: 'scrollLine 1.8s ease infinite' }} />
        </div>
      </section>

      {/* ══ BANDE DE STATUT ══ */}
      <div style={{ background: 'var(--primary)', padding: '14px var(--pad-x)' }}>
        <div className="inner" style={{ padding: '0 var(--pad-x)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Clock size={15} color="var(--accent-light)" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.85)' }}>
              {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', borderRadius: 'var(--r-full)', background: coul.bg, color: coul.color, border: `1px solid ${coul.border}` }}>
              ● {coul.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {messesDuJour && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.85)' }}>
                Messes · {messesDuJour.jour} : <strong style={{ color: '#fff' }}>{messesDuJour.horaires.join(' · ')}</strong>
              </span>
            )}
            <Link href="/horaires" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-light)', textDecoration: 'none' }}>
              Horaires{courante ? ` · ${courante.nom}` : ' des messes'} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ══ PAR OÙ COMMENCER ? ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        <div className="inner">
          <div className="reveal" style={{ maxWidth: 600, marginBottom: 40 }}>
            <span className="section-label">Bienvenue</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>Par où commencer ?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 12, lineHeight: 1.75 }}>
              Croyant, curieux ou en recherche : l'archidiocèse de Brazzaville vous accompagne là où vous en êtes.
            </p>
          </div>
          <div className="grid-4">
            {PORTES.map(p => (
              <Link key={p.to} href={p.to} className="dark-card reveal" style={{ padding: 26, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="icon-tile" style={{ background: 'var(--primary)', color: 'var(--accent-light)' }}>
                  <p.icon size={22} />
                </div>
                <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{p.titre}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, flex: 1 }}>{p.desc}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)' }}>
                  Commencer <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ACCÈS RAPIDE ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)' }}>
        <div className="inner">
          <div className="reveal" style={{ maxWidth: 560, marginBottom: 40 }}>
            <span className="section-label">Vie spirituelle</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>Au rythme de la foi chrétienne</h2>
          </div>
          <div className="grid-3">
            {QUICK_ACCESS.map((q, i) => (
              <Link key={i} href={q.to} className="dark-card reveal" style={{ padding: 26, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="icon-tile" style={{ background: q.bg, color: q.fg }}>
                  <q.icon size={22} />
                </div>
                <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{q.titre}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, flex: 1 }}>{q.desc}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)' }}>
                  Découvrir <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
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
            <Link href="/liturgie" className="btn-gold">Lire les lectures du jour</Link>
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
            <Link href="/annonces" className="btn-outline" style={{ fontSize: 10, flexShrink: 0 }}>Tout voir →</Link>
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
                <span style={{ padding: '4px 10px', background: 'rgba(62,124,177,.1)', border: '1px solid rgba(62,124,177,.2)', borderRadius: 'var(--r-full)', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: 'var(--blue)', whiteSpace: 'nowrap' }}>{a.tag}</span>
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
              <Link key={i} href="/catechese" className="dark-card reveal" style={{
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

      {/* ══ PROJETS & SOLIDARITÉ ══ */}
      {projets.length > 0 && (
        <section style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)' }}>
          <div className="inner">
            <div className="reveal" style={{ maxWidth: 640, margin: '0 auto 48px', textAlign: 'center' }}>
              <span className="section-label" style={{ justifyContent: 'center' }}>Projets Paroissiaux</span>
              <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>Préservation du sanctuaire &amp; solidarité</h2>
            </div>
            <div className="grid-3">
              {projets.map(p => {
                const pct = p.objectif > 0 ? Math.min(100, Math.round((p.collecte / p.objectif) * 100)) : 0
                return (
                  <div key={p.id} className="dark-card reveal" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="icon-tile" style={{ background: 'var(--bg-alt)', color: 'var(--primary)', fontSize: 22 }}>{p.emoji}</div>
                    <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{p.titre}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, flex: 1 }}>{p.description}</p>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                        <span style={{ color: 'var(--primary)' }}>{pct}% Financé</span>
                        <span style={{ color: 'var(--text-light)', fontFamily: 'monospace' }}>{formatXAF(p.collecte)} / {formatXAF(p.objectif)}</span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'var(--bg-alt)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 'var(--r-full)', background: 'linear-gradient(90deg, var(--accent), var(--primary-mid))', width: `${pct}%`, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                    <Link href="/dons" className="btn-gold" style={{ justifyContent: 'center', fontSize: 10 }}>Soutenir ce projet</Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ HISTOIRE ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%)' }}>
        <div className="inner grid-2" style={{ alignItems: 'center', gap: 'clamp(28px,5vw,72px)' }}>
          <div className="reveal">
            <span className="section-label" style={{ color: 'var(--accent-light)' }}>Notre Identité</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Notre histoire</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: 14 }}>
              {archidiocese?.presentation ?? "Depuis plus d'un siècle, la Cathédrale Sacré-Cœur est le cœur spirituel de Brazzaville et de l'Archidiocèse du Congo."}
            </p>
            {HISTOIRE.map(h => (
              <div key={h.annee} style={{ display: 'flex', gap: 18, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--accent-light)', minWidth: 52 }}>{h.annee}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, paddingTop: 3 }}>{h.texte}</span>
              </div>
            ))}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/histoire" className="btn-gold">Histoire de la cathédrale</Link>
              <Link href="/histoire-archidiocese" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff', fontFamily: 'var(--v2-font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 'var(--r-md)' }}>Histoire de l&apos;archidiocèse</Link>
            </div>
          </div>
          <div className="reveal" style={{ position: 'relative' }}>
            <img src="/cathedrale.jpg" alt="Histoire" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', filter: 'brightness(.75) saturate(.7)' }} />
            <div style={{ position: 'absolute', inset: 'auto -16px -16px auto', width: '55%', height: '45%', borderRight: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)' }} />
          </div>
        </div>
      </section>

      {/* ══ À LA UNE (MÉDIATION) ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)' }}>
        <div className="inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, gap: 16, flexWrap: 'wrap' }} className="reveal">
            <div>
              <span className="section-label">Médiation</span>
              <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>À la une</h2>
            </div>
            <Link href="/tv" className="btn-outline" style={{ fontSize: 10, flexShrink: 0 }}>La chaîne →</Link>
          </div>

          {prochainDirect && (
            <Link href="/tv" className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', marginBottom: 24, background: 'var(--primary)', textDecoration: 'none', flexWrap: 'wrap' }}>
              {prochainDirect.statut === 'en_direct'
                ? <span className="live-badge"><span className="live-dot" />EN DIRECT</span>
                : <CalendarClock size={20} color="var(--accent-light)" />}
              <span style={{ flex: 1, minWidth: 200 }}>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-light)' }}>
                  {prochainDirect.statut === 'en_direct' ? 'Maintenant' : `Prochain direct · ${new Date(prochainDirect.debut).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`}
                </span>
                <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, color: '#fff' }}>{prochainDirect.titre}</span>
              </span>
              <ArrowRight size={16} color="#fff" />
            </Link>
          )}

          {aLaUne.length > 0 ? (
            <div className="reveal grid-med">
              {aLaUne.map(v => <VideoCard key={v.id} ev={v} />)}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Les vidéos de la chaîne seront bientôt disponibles.</p>
          )}
        </div>
      </section>

      {/* ══ TRACES DU PASSÉ ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        <div className="inner">
          <div className="reveal" style={{ maxWidth: 640, margin: '0 auto 40px', textAlign: 'center' }}>
            <span className="section-label" style={{ justifyContent: 'center' }}>Archives &amp; Mémoire</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>Traces du passé</h2>
          </div>
          <div className="grid-4">
            {HISTOIRE.map(h => (
              <Link key={h.annee} href="/histoire" className="dark-card reveal" style={{ overflow: 'hidden', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden' }}>
                  <img src="/cathedrale.jpg" alt={h.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.15)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,59,93,.15)' }} />
                  <span style={{ position: 'absolute', top: 10, right: 10, padding: '2px 9px', background: 'rgba(18,59,93,.85)', color: '#fff', fontSize: 9, fontFamily: 'monospace', borderRadius: 3 }}>{h.annee}</span>
                </div>
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{h.titre}</h3>
                  <span style={{ marginTop: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Consulter la notice <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/histoire" className="btn-outline">Consulter toute la chronologie</Link>
          </div>
        </div>
      </section>

      {/* ══ DON & SOLIDARITÉ (bandeau) ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--primary)', textAlign: 'center' }}>
        <div className="inner" style={{ maxWidth: 680 }}>
          <div className="icon-tile reveal" style={{ background: 'rgba(255,255,255,.1)', color: 'var(--accent-light)', margin: '0 auto 20px', border: '1px solid rgba(228,199,102,.4)' }}>
            <HandHeart size={24} />
          </div>
          <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            Participez à la préservation du sanctuaire
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: 30 }}>
            Vos offrandes permettent d'entretenir la cathédrale, de soutenir les projets paroissiaux et de financer les œuvres de charité à Brazzaville.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dons" className="btn-gold">Faire un don (Mobile Money / Carte)</Link>
            <Link href="/horaires" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff', fontFamily: 'var(--v2-font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 'var(--r-md)' }}>
              Secrétariat paroissial
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
