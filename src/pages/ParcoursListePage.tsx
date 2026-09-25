import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Droplets } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getParcoursPublies, getMesParcours, TYPE_PARCOURS,
  type Parcours, type ProgressionParcours, type TypeParcours,
} from '../services/parcours'
import { getTemoignagesApprouves, getCategoriesTemoignage, type Temoignage } from '../services/temoignages'
import { getPlaylistsPubliques } from '../services/mediation'
import { getEvenements, type Evenement, type PublicCible } from '../services/evenements'
import { VideoCard } from '../components/VideoCard'

const PUBLIC_PAR_TYPE: Partial<Record<TypeParcours, PublicCible>> = {
  decouvrir: 'decouvre',
  conversion: 'conversion',
  approfondir: 'approfondir',
}

const INTRO: Partial<Record<TypeParcours, { eyebrow: string; titre: [string, string]; texte: string }>> = {
  decouvrir: {
    eyebrow: 'Premiers pas',
    titre: ['Je découvre', 'la foi'],
    texte: "Vous vous posez des questions sur Dieu, sur Jésus, sur le sens de la vie ? Ces parcours courts, simples et sans engagement sont faits pour vous. Avancez à votre rythme.",
  },
  conversion: {
    eyebrow: 'Conversion & catéchuménat',
    titre: ['Je veux', 'me convertir'],
    texte: "Devenir chrétien est un chemin, et personne ne le parcourt seul. Découvrez les étapes du catéchuménat, des témoignages de convertis, et faites le premier pas vers un prêtre de votre paroisse.",
  },
  approfondir: {
    eyebrow: 'Formation chrétienne',
    titre: ['Approfondir', 'ma foi'],
    texte: "Pour les baptisés qui veulent aller plus loin : Écriture sainte, doctrine, vie spirituelle et engagement dans l'Église et la société.",
  },
}

export function ParcoursListePage({ type }: { type: TypeParcours }) {
  const { user } = useAuth()
  const [parcours, setParcours] = useState<Parcours[]>([])
  const [progression, setProgression] = useState<Map<string, ProgressionParcours>>(new Map())
  const [videos, setVideos] = useState<Evenement[]>([])
  const [temoignages, setTemoignages] = useState<Temoignage[]>([])
  const [loading, setLoading] = useState(true)
  const intro = INTRO[type]!

  useEffect(() => {
    getParcoursPublies([type]).then(setParcours).catch(() => setParcours([])).finally(() => setLoading(false))

    const cible = PUBLIC_PAR_TYPE[type]
    if (cible) {
      Promise.all([getPlaylistsPubliques(), getEvenements()]).then(([pls, evs]) => {
        const ids = new Set(pls.filter(p => p.publicCible === cible).flatMap(p => p.evenementIds))
        setVideos(evs.filter(e => (e.id && ids.has(e.id)) || e.publicCible === cible).slice(0, 3))
      }).catch(() => setVideos([]))
    }

    if (type === 'conversion') {
      Promise.all([getTemoignagesApprouves(), getCategoriesTemoignage()]).then(([t, cats]) => {
        const conv = cats.find(c => c.slug === 'conversion')?.id
        setTemoignages(t.filter(x => x.categorieId === conv).slice(0, 3))
      }).catch(() => setTemoignages([]))
    }
  }, [type])

  useEffect(() => {
    if (!user) return
    getMesParcours(user.id).then(p => setProgression(new Map(p.map(x => [x.parcours.id, x])))).catch(() => {})
  }, [user])

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">{intro.eyebrow}</p>
          <h1>{intro.titre[0]} <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>{intro.titre[1]}</em></h1>
        </div>
      </div>

      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        <div className="inner">
          <div className="reveal" style={{ maxWidth: 640, marginBottom: 40 }}>
            <span className="section-label">{TYPE_PARCOURS[type].label}</span>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8 }}>{intro.texte}</p>
          </div>

          {loading ? (
            <div className="page-loader"><div className="page-loader-ring" /></div>
          ) : parcours.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Les parcours seront disponibles prochainement.</p>
          ) : (
            <div className="grid-3">
              {parcours.map(p => {
                const prog = progression.get(p.id)
                const pct = prog && prog.total > 0 ? Math.round((prog.faites / prog.total) * 100) : 0
                return (
                  <Link key={p.id} to={`/parcours/${p.slug}`} className="dark-card reveal" style={{ padding: 26, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 34 }}>{p.emoji}</span>
                    {p.duree && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', color: 'var(--accent-dark)', textTransform: 'uppercase' }}>{p.duree}</span>}
                    <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{p.titre}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, flex: 1 }}>{p.description}</p>
                    {prog && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                          <span style={{ color: 'var(--primary)' }}>{prog.termineLe ? 'Terminé ✓' : `${pct}% parcouru`}</span>
                          <span style={{ color: 'var(--text-light)' }}>{prog.faites}/{prog.total}</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--bg-alt)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--primary-mid))', width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)' }}>
                      {prog ? 'Continuer' : 'Commencer'} <ArrowRight size={13} />
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {videos.length > 0 && (
        <section style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)' }}>
          <div className="inner">
            <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <span className="section-label">Médiation</span>
                <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,34px)', fontWeight: 700, color: 'var(--text)' }}>À regarder</h2>
              </div>
              <Link to={`/tv?public=${PUBLIC_PAR_TYPE[type]}`} className="btn-outline" style={{ fontSize: 10 }}>Toutes les vidéos →</Link>
            </div>
            <div className="grid-3">
              {videos.map(v => <VideoCard key={v.id} ev={v} />)}
            </div>
          </div>
        </section>
      )}

      {type === 'conversion' && temoignages.length > 0 && (
        <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
          <div className="inner" style={{ maxWidth: 820 }}>
            <div className="reveal" style={{ marginBottom: 28 }}>
              <span className="section-label">Ils ont fait le pas</span>
              <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,34px)', fontWeight: 700, color: 'var(--text)' }}>Témoignages de conversion</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {temoignages.map(t => (
                <div key={t.id} className="reveal" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', padding: '24px 28px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{t.contenu}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 12, fontWeight: 600 }}>— {t.auteurNom || 'Anonyme'}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <Link to="/temoignages?categorie=conversion" className="btn-outline" style={{ fontSize: 10 }}>Tous les témoignages →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ APPEL À L'ACTION ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--primary)', textAlign: 'center' }}>
        <div className="inner" style={{ maxWidth: 680 }}>
          <div className="icon-tile reveal" style={{ background: 'rgba(255,255,255,.1)', color: 'var(--accent-light)', margin: '0 auto 20px', border: '1px solid rgba(228,199,102,.4)' }}>
            {type === 'conversion' ? <Droplets size={24} /> : <MessageCircle size={24} />}
          </div>
          <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            {type === 'conversion' ? 'Prêt à faire le premier pas ?' : 'Envie d\'en parler avec quelqu\'un ?'}
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: 30 }}>
            {type === 'conversion'
              ? "Faites une demande de baptême d'adulte : l'équipe de votre paroisse vous recontactera pour une première rencontre, en toute simplicité."
              : 'Un prêtre ou un membre de la paroisse sera heureux de vous écouter, sans engagement et en toute confidentialité.'}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {type === 'conversion' ? (
              <Link to="/demarches?type=bapteme" className="btn-gold">Demander le baptême</Link>
            ) : (
              <Link to="/demarches?type=accompagnement" className="btn-gold">Parler à un prêtre</Link>
            )}
            <Link to="/paroisses" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff', fontFamily: 'var(--v2-font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 'var(--r-md)' }}>
              Trouver une paroisse
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
