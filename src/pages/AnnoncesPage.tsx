import { PageWrapper } from '../components/layout/PageWrapper'
import { useState, useEffect, useRef } from 'react'

type Tag = 'all' | 'Liturgie' | 'Formation' | 'Prière' | 'Événement'

interface Annonce {
  id: number
  d: string
  m: string
  titre: string
  desc: string
  tag: Tag
  epingle: boolean
  icon: string
  image?: string
}

// Structure prête pour l'admin — ces données viendront de Supabase en Phase 2
const ANNONCES: Annonce[] = [
  {
    id: 1, d: '27', m: 'Juin',
    titre: 'Fête du Sacré-Cœur — Procession solennelle',
    desc: 'Grande célébration liturgique présidée par l\'Archevêque, suivie d\'une procession dans les rues du centre-ville de Brazzaville.',
    tag: 'Liturgie', epingle: true, icon: 'church',
    image: 'https://images.unsplash.com/photo-1548625149-720754873c24?w=800&q=80',
  },
  {
    id: 2, d: '15', m: 'Juin',
    titre: 'Retraite spirituelle — Journée de ressourcement',
    desc: 'Une journée de retraite animée par le Père Provincial. Inscription recommandée avant le 12 juin.',
    tag: 'Événement', epingle: true, icon: 'self_improvement',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
  {
    id: 3, d: '10', m: 'Juin',
    titre: 'Inscriptions catéchisme 2026-2027 ouvertes',
    desc: 'Enfants de 6 à 15 ans. Formulaire disponible à l\'accueil de la cathédrale ou en ligne.',
    tag: 'Formation', epingle: true, icon: 'school',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  },
  {
    id: 4, d: '08', m: 'Juin',
    titre: 'Journée de prière pour la paix au Congo',
    desc: 'Chapelet collectif à 15h, suivi d\'une messe de supplication pour la paix et la réconciliation nationale.',
    tag: 'Prière', epingle: false, icon: 'volunteer_activism',
  },
  {
    id: 5, d: '05', m: 'Juil',
    titre: 'Formation des catéchistes — Module 2',
    desc: 'Thème : méthodes d\'animation pour enfants. Présence obligatoire pour les catéchistes en service.',
    tag: 'Formation', epingle: false, icon: 'groups',
  },
  {
    id: 6, d: '20', m: 'Juil',
    titre: 'Concert de musique sacrée',
    desc: 'La chorale diocésaine vous invite à une soirée de louange et de musique sacrée dans la nef de la cathédrale.',
    tag: 'Événement', epingle: false, icon: 'music_note',
  },
]

const TAGS: { value: Tag; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'Liturgie', label: 'Liturgie' },
  { value: 'Formation', label: 'Formation' },
  { value: 'Prière', label: 'Prière' },
  { value: 'Événement', label: 'Événements' },
]

const TAG_COLORS: Record<string, string> = {
  Liturgie: 'var(--primary)',
  Formation: 'var(--liturgy-green)',
  Prière: 'var(--liturgy-purple)',
  Événement: 'var(--secondary)',
}

// ── Carrousel des annonces épinglées ──────────────────────────────────────────
function Carousel({ items }: { items: Annonce[] }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = (idx: number) => {
    setCurrent(idx)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % items.length)
    }, 15000)
  }

  useEffect(() => {
    if (items.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % items.length)
    }, 15000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [items.length])

  if (items.length === 0) return null

  const a = items[current]
  const color = TAG_COLORS[a.tag] || 'var(--primary)'

  return (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      {/* ── Carte principale ── */}
      <div
        className="card"
        style={{
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          transition: 'box-shadow 0.25s',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
      >
        {/* Image */}
        {a.image && (
          <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
            <img
              src={a.image}
              alt={a.titre}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.6s ease',
              }}
              onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = 'scale(1.04)')}
              onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = 'scale(1)')}
            />
            {/* Overlay gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
            }} />
            {/* Badge tag sur l'image */}
            <span style={{
              position: 'absolute', top: 12, left: 12,
              padding: '4px 10px', borderRadius: 'var(--r-full)',
              background: color, color: 'white',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>{a.tag}</span>
            {/* Épingle */}
            <span style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              borderRadius: 'var(--r-full)', padding: '4px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'white', fontWeight: 600,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>push_pin</span>
              Important
            </span>
          </div>
        )}

        {/* Corps */}
        <div style={{ padding: 'var(--space-md)' }}>
          {!a.image && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>{a.tag}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Date badge */}
            <div style={{
              minWidth: 52, height: 52, borderRadius: 'var(--r-lg)',
              background: 'var(--surface-container)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22, color: 'var(--primary)', lineHeight: 1 }}>{a.d}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.m}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p className="text-label-md" style={{ color: 'var(--on-surface)', lineHeight: 1.4, marginBottom: 6 }}>{a.titre}</p>
              <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.55 }}>{a.desc}</p>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        {items.length > 1 && (
          <div style={{ height: 3, background: 'var(--surface-container)' }}>
            <div
              key={current}
              style={{
                height: '100%', background: color,
                animation: 'progress-bar 15s linear forwards',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Dots de navigation ── */}
      {items.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => reset(i)}
              style={{
                width: i === current ? 24 : 8, height: 8,
                borderRadius: 'var(--r-full)',
                background: i === current ? color : 'var(--outline-variant)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'width 0.3s, background 0.3s',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Vignettes miniatures ── */}
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }} className="no-scrollbar">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => reset(i)}
              style={{
                flex: '0 0 auto', width: 80, height: 56,
                borderRadius: 'var(--r-lg)',
                overflow: 'hidden',
                border: i === current ? `2px solid ${TAG_COLORS[item.tag] || 'var(--primary)'}` : '2px solid transparent',
                cursor: 'pointer', padding: 0, background: 'var(--surface-container)',
                transition: 'border-color 0.25s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {item.image
                ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span className="material-symbols-outlined" style={{ fontSize: 22, color: TAG_COLORS[item.tag] || 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              }
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Carte annonce simple ──────────────────────────────────────────────────────
function AnnonceCard({ d, m, titre, desc, tag, delay }: Omit<Annonce, 'icon'> & { icon?: string; delay: number }) {
  const color = TAG_COLORS[tag] || 'var(--primary)'
  return (
    <div
      className="card animate-slide-up"
      style={{
        padding: '14px var(--space-md)',
        display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
        cursor: 'pointer', animationDelay: `${delay * 50}ms`,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container-low)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
    >
      <div style={{
        minWidth: 48, height: 48, borderRadius: 'var(--r-lg)',
        background: 'var(--surface-container)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--primary)', lineHeight: 1 }}>{d}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>{tag}</span>
        </div>
        <p className="text-label-md" style={{ color: 'var(--on-surface)', marginBottom: 4, lineHeight: 1.4 }}>{titre}</p>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5 }}>{desc}</p>
      </div>
      <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20, flexShrink: 0, marginTop: 2 }}>chevron_right</span>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function AnnoncesPage() {
  const [filtre, setFiltre] = useState<Tag>('all')
  const filtered = ANNONCES.filter(a => filtre === 'all' || a.tag === filtre)
  const pinned = filtered.filter(a => a.epingle)
  const others = filtered.filter(a => !a.epingle)

  return (
    <PageWrapper>
      <div>
        {/* ── Titre ── */}
        <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
          <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>Annonces & Agenda</h1>
          <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Vie de la communauté diocésaine
          </p>
        </div>

        {/* ── Chips filtres ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 'var(--space-md)' }} className="no-scrollbar">
          {TAGS.map(t => (
            <button
              key={t.value}
              onClick={() => setFiltre(t.value)}
              className={`chip ${filtre === t.value ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Carrousel épinglées ── */}
        {pinned.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--secondary)', fontVariationSettings: "'FILL' 1" }}>push_pin</span>
              <p className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                Annonces importantes
                {pinned.length > 1 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--outline)' }}>
                    — défilement automatique toutes les 15 s
                  </span>
                )}
              </p>
            </div>
            <Carousel items={pinned} />
          </>
        )}

        {/* ── Agenda ── */}
        {others.length > 0 && (
          <div>
            <p className="text-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 10 }}>Agenda</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {others.map((a, i) => <AnnonceCard key={a.id} {...a} delay={i} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>event_busy</span>
            <p className="text-body-md">Aucune annonce dans cette catégorie.</p>
          </div>
        )}

        {/* ── Note admin (visible uniquement en dev) ── */}
        <div style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-md)', borderRadius: 'var(--r-xl)',
          background: 'rgba(115,92,0,0.06)', border: '1px dashed rgba(115,92,0,0.25)',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 22, flexShrink: 0, fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          <div>
            <p className="text-label-sm" style={{ color: 'var(--secondary)', marginBottom: 2 }}>Portail Administration — Phase 2</p>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              Les annonces, images et contenus de formation seront gérés via le portail d'administration sécurisé. Les administrateurs pourront publier, épingler et planifier les annonces avec images.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
