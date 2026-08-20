import { useState } from 'react'

/* ── données ── */
const MODULES = [
  {
    num: 1, titre: 'Fondements de la Foi', lecons: 15,
    progress: 80, status: 'active',
    stripe: '#2e7d32',
  },
  {
    num: 2, titre: 'Histoire de l\'Église au Congo', lecons: 8,
    progress: 0, status: 'new',
    stripe: '#2e7d32',
  },
  {
    num: 3, titre: 'Doctrine Sociale de l\'Église', lecons: 12,
    progress: 0, status: 'locked',
    stripe: '#2e7d32',
  },
  {
    num: 4, titre: 'Liturgie et Sacrements', lecons: 10,
    progress: 0, status: 'locked',
    stripe: '#7b1fa2',
  },
  {
    num: 5, titre: 'Écriture Sainte — Nouveau Testament', lecons: 18,
    progress: 0, status: 'locked',
    stripe: '#7b1fa2',
  },
]

const FORMATEURS = [
  { nom: 'Mgr. Fulgence', specialite: 'Écriture Sainte', initiales: 'MF', border: 'var(--secondary)' },
  { nom: 'Mme. Thérèse', specialite: 'Catéchèse', initiales: 'MT', border: 'var(--primary-fixed)' },
  { nom: 'Père Bernard', specialite: 'Théologie Morale', initiales: 'PB', border: 'var(--primary-fixed)' },
  { nom: 'Diacre Jean', specialite: 'Service de Charité', initiales: 'DJ', border: 'var(--primary-fixed)' },
  { nom: 'Sœur Marie-C.', specialite: 'Vie consacrée', initiales: 'SM', border: 'var(--primary-fixed)' },
]

const VIDEOS = [
  {
    titre: 'Introduction à l\'Ecclésiologie',
    duree: '12:45', formateur: 'Père Antoine M.',
    big: true,
  },
  {
    titre: 'Les Sacrements : Signes de Grâce',
    duree: '08:20', formateur: 'Père Antoine M.',
    big: false,
  },
  {
    titre: 'Liturgie et Vie Chrétienne',
    duree: '15:10', formateur: 'Sœur Marie-Cécile',
    big: false,
  },
]

const WEBINAIRES = [
  {
    d: '15', m: 'Mar', titre: 'Le Rôle des Laïcs aujourd\'hui',
    heure: '18h30', plateforme: 'Zoom', stripe: null,
  },
  {
    d: '02', m: 'Avr', titre: 'Webinaire : Carême et Conversion',
    heure: '19h00', plateforme: 'Live FB', stripe: 'var(--secondary)',
  },
]

/* ── composant principal ── */
export function VieSpirituellePage() {
  const [_tab, _setTab] = useState<'modules' | 'videos'>('modules')

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* ── Hero ── */}
      <section style={{ padding: 'var(--space-md) var(--margin) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
          <div>
            <span className="text-label-sm" style={{ color: 'var(--secondary)' }}>
              Académie de Formation
            </span>
            <h1 className="text-headline-mobile" style={{ color: 'var(--primary)', marginTop: 4, lineHeight: 1.2 }}>
              Former le Peuple de Dieu
            </h1>
          </div>
          <a
            href="#"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 'var(--r-lg)',
              background: 'rgba(0,35,111,0.08)',
              color: 'var(--primary)',
              textDecoration: 'none',
              fontSize: 14, fontWeight: 600,
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>forum</span>
            Forum
          </a>
        </div>
        <p
          className="text-body-lg"
          style={{ color: 'var(--on-surface-variant)', fontStyle: 'italic', marginBottom: 'var(--space-md)' }}
        >
          "Allez, enseignez toutes les nations…" (Mt 28,19)
        </p>
      </section>

      {/* ── Galerie vidéos ── */}
      <section style={{ padding: '0 var(--margin)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <h3 className="text-title-md" style={{ color: 'var(--primary)' }}>Leçons Vidéo Récentes</h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', fontWeight: 600, fontSize: 14 }}>
            Voir tout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 10 }}>
          {/* Grande vidéo — couvre 2 rangées */}
          <div
            style={{
              gridRow: '1 / 3',
              position: 'relative', borderRadius: 'var(--r-xl)',
              overflow: 'hidden', height: 240,
              background: 'linear-gradient(135deg, var(--primary-container), var(--primary))',
              cursor: 'pointer',
              border: '1px solid rgba(0,35,111,0.1)',
            }}
          >
            {/* Dégradé + contenu */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
            }} />
            {/* Icône play centrale */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 52, height: 52, borderRadius: 'var(--r-full)',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>play_circle</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--secondary-fixed)', fontSize: 14 }}>play_circle</span>
                <span style={{ color: 'var(--secondary-fixed)', fontSize: 12, fontWeight: 600 }}>12:45</span>
              </div>
              <h4
                className="text-title-md"
                style={{ color: 'white', fontSize: 16, lineHeight: 1.3 }}
              >
                Introduction à l'Ecclésiologie
              </h4>
            </div>
          </div>

          {/* Petites vidéos */}
          {VIDEOS.slice(1).map((v, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                borderRadius: 'var(--r-xl)',
                padding: '10px 12px',
                display: 'flex', gap: 10, alignItems: 'center',
                cursor: 'pointer',
                borderTop: '1px solid var(--secondary)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.98)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
            >
              {/* Thumbnail placeholder */}
              <div style={{
                width: 60, height: 60, borderRadius: 'var(--r-lg)',
                background: `linear-gradient(135deg, var(--primary-container), var(--surface-tint))`,
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 22, fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="text-label-md" style={{ fontSize: 13, color: 'var(--on-surface)', lineHeight: 1.35, marginBottom: 3 }}>
                  {v.titre}
                </p>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{v.formateur}</p>
                <p style={{ fontSize: 11, color: 'var(--secondary)', fontWeight: 600, marginTop: 2 }}>{v.duree}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules théologiques ── */}
      <section style={{ padding: '0 var(--margin)', marginBottom: 'var(--space-lg)' }}>
        <h3 className="text-title-md" style={{ color: 'var(--primary)', marginBottom: 'var(--space-sm)' }}>
          Modules Théologiques
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODULES.map((m) => (
            <ModuleRow key={m.num} {...m} />
          ))}
        </div>
      </section>

      {/* ── Formateurs ── */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 className="text-title-md" style={{ color: 'var(--primary)', padding: '0 var(--margin)', marginBottom: 'var(--space-sm)' }}>
          Nos Formateurs
        </h3>
        <div
          style={{
            display: 'flex', gap: 'var(--space-md)',
            overflowX: 'auto', padding: '4px var(--margin) 12px',
            scrollSnapType: 'x mandatory',
          }}
          className="no-scrollbar custom-scrollbar"
        >
          {FORMATEURS.map((f) => (
            <div
              key={f.nom}
              style={{
                flexShrink: 0, width: 112,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                scrollSnapAlign: 'center',
              }}
            >
              {/* Avatar initiales */}
              <div style={{
                width: 80, height: 80,
                borderRadius: 'var(--r-full)',
                border: `2.5px solid ${f.border}`,
                padding: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: 'var(--r-full)',
                  background: 'linear-gradient(135deg, var(--primary-container), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700,
                  color: 'white', letterSpacing: '-0.02em',
                }}>
                  {f.initiales}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: 'var(--on-surface)', lineHeight: 1.3 }}>
                  {f.nom}
                </p>
                <p style={{ fontSize: 11, color: 'var(--secondary)', marginTop: 2 }}>
                  {f.specialite}
                </p>
              </div>
            </div>
          ))}
        </div>
        <style>{`.custom-scrollbar::-webkit-scrollbar { height: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--gold-accent); border-radius: 10px; }`}</style>
      </section>

      {/* ── Prochains Webinaires ── */}
      <section style={{ padding: '0 var(--margin)', marginBottom: 'var(--space-lg)' }}>
        <h3 className="text-title-md" style={{ color: 'var(--primary)', marginBottom: 'var(--space-sm)' }}>
          Prochains Webinaires
        </h3>
        <div style={{
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--r-xl)',
          padding: 'var(--space-sm)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {WEBINAIRES.map((w, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '12px var(--space-md)',
                display: 'flex', gap: 'var(--space-md)', alignItems: 'center',
                borderLeft: w.stripe ? `2px solid ${w.stripe}` : undefined,
              }}
            >
              {/* Badge date */}
              <div style={{
                minWidth: 52, height: 56,
                borderRadius: 'var(--r-lg)',
                background: w.stripe
                  ? 'rgba(115,92,0,0.12)'
                  : 'rgba(0,35,111,0.08)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: w.stripe ? 'var(--secondary)' : 'var(--primary)',
                }}>
                  {w.m}
                </span>
                <span style={{
                  fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22,
                  color: w.stripe ? 'var(--secondary)' : 'var(--primary)',
                  lineHeight: 1,
                }}>
                  {w.d}
                </span>
              </div>

              {/* Infos */}
              <div style={{ flex: 1 }}>
                <p className="text-label-md" style={{ color: 'var(--on-surface)', lineHeight: 1.35 }}>
                  {w.titre}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>schedule</span>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                    {w.heure} · {w.plateforme}
                  </span>
                </div>
              </div>

              {/* Bouton */}
              <button
                style={{
                  padding: '5px 14px', borderRadius: 'var(--r-full)',
                  background: 'var(--primary)', color: 'white',
                  fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'transform 0.1s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                S'inscrire
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

/* ── Ligne de module ── */
function ModuleRow({ num, titre, lecons, progress, status, stripe }: {
  num: number; titre: string; lecons: number;
  progress: number; status: string; stripe: string
}) {
  const isActive = status === 'active'
  const isNew = status === 'new'
  const isLocked = status === 'locked'

  return (
    <div
      className="card"
      style={{
        padding: '14px var(--space-md)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        borderLeft: `4px solid ${stripe}`,
        opacity: isLocked ? 0.65 : 1,
        transition: 'box-shadow 0.15s',
        cursor: isLocked ? 'default' : 'pointer',
      }}
      onMouseEnter={e => { if (!isLocked) (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)' }}
    >
      {/* Numéro */}
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-full)',
        background: isActive ? 'var(--primary-container)' : 'var(--surface-container-highest)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15,
        color: isActive ? 'white' : 'var(--on-surface)',
        flexShrink: 0,
      }}>
        {num}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="text-label-md" style={{ color: 'var(--on-surface)', lineHeight: 1.3 }}>{titre}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
            {lecons} leçons
          </span>
          {isActive && progress > 0 && (
            <>
              <span style={{ color: 'var(--outline-variant)', fontSize: 10 }}>•</span>
              <span style={{ fontSize: 12, color: 'var(--secondary)', fontWeight: 600 }}>
                {progress}% complété
              </span>
            </>
          )}
          {isNew && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--secondary)', background: 'rgba(115,92,0,0.1)',
              padding: '2px 7px', borderRadius: 'var(--r-full)',
            }}>
              Nouveau
            </span>
          )}
        </div>

        {/* Barre de progression */}
        {isActive && progress > 0 && (
          <div style={{
            marginTop: 8, height: 4, borderRadius: 'var(--r-full)',
            background: 'var(--surface-container-highest)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--primary-container), var(--primary))',
              borderRadius: 'var(--r-full)',
              transition: 'width 0.4s var(--ease-out)',
            }} />
          </div>
        )}
      </div>

      {/* Icône droite */}
      <span
        className="material-symbols-outlined"
        style={{ color: isLocked ? 'var(--outline-variant)' : 'var(--primary)', fontSize: 22, flexShrink: 0 }}
      >
        {isLocked ? 'lock' : 'chevron_right'}
      </span>
    </div>
  )
}
