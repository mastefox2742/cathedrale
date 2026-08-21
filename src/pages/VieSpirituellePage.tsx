import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Lock } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { getIntentionsPubliques, deposerIntention, type PrayerIntention } from '../services/prieres'
import { getGroupes, type Groupe } from '../services/groupes'

const FORMATIONS = [
  { num: 'I', tag: 'Bible', titre: 'Introduction à la Sainte Écriture', desc: "Découverte des deux Testaments, grandes figures bibliques et méthodes d'interprétation catholique. Accessible à tous, aucun prérequis.", horaire: 'Lundi 18h – 19h30', lieu: 'Salle Saint-Augustin' },
  { num: 'II', tag: 'Théologie', titre: 'Fondements de la Foi Catholique', desc: "Exploration du Credo, des sacrements, de l'Église et de la doctrine sociale. Cours structuré sur 8 modules de 2h.", horaire: 'Jeudi 18h – 20h', lieu: 'Salle Saint-Thomas' },
  { num: 'III', tag: 'Prière', titre: 'École de Prière — Lectio Divina', desc: 'Initiation à la prière biblique méditée selon la tradition de la Lectio Divina. Silence, lecture et partage fraternel.', horaire: 'Vendredi 17h30 – 19h', lieu: 'Chapelle latérale' },
  { num: 'IV', tag: 'Doctrine', titre: "Doctrine Sociale de l'Église", desc: 'Étude des encycliques et grands principes — dignité de la personne, bien commun, solidarité, subsidiarité — appliqués au Congo.', horaire: 'Samedi 9h – 11h', lieu: 'Salle paroissiale' },
]

const PRIERES = [
  { icon: '🛡️', titre: 'Prière à Saint Michel', sous: 'Archange protecteur de la paroisse', texte: '« Saint Michel Archange, défendez-nous dans le combat ; soyez notre secours contre la malice et les embûches du démon… »' },
  { icon: '📿', titre: 'Le Saint Rosaire', sous: 'Mystères douloureux (vendredi)', texte: 'Je vous salue Marie, pleine de grâce ; le Seigneur est avec vous. Vous êtes bénie entre toutes les femmes…' },
  { icon: '☀️', titre: "L'Angélus", sous: 'À 6h, 12h et 18h', texte: "L'Ange du Seigneur apporta l'annonce à Marie, et elle conçut du Saint-Esprit…" },
  { icon: '✝️', titre: 'Chemin de Croix', sous: 'Méditation des 14 stations', texte: 'Nous vous adorons, ô Christ, et nous vous bénissons, parce que vous avez racheté le monde par votre sainte croix.' },
]

function contactHref(contact: string) {
  return contact.includes('@') ? `mailto:${contact}` : `tel:${contact.replace(/\s/g, '')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function VieSpirituellePage() {
  const navigate = useNavigate()
  const [openPriere, setOpenPriere] = useState<number | null>(null)
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [contenu, setContenu] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [estAnonyme, setEstAnonyme] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [intentions, setIntentions] = useState<PrayerIntention[]>([])
  const [loadingIntentions, setLoadingIntentions] = useState(true)
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loadingGroupes, setLoadingGroupes] = useState(true)

  const loadIntentions = useCallback(() => {
    setLoadingIntentions(true)
    getIntentionsPubliques().then(setIntentions).catch(() => setIntentions([])).finally(() => setLoadingIntentions(false))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    loadIntentions()
    getGroupes().then(setGroupes).catch(() => setGroupes([])).finally(() => setLoadingGroupes(false))
  }, [loadIntentions])

  async function submitIntention() {
    if (!session || contenu.trim().length < 3) return
    setSubmitting(true)
    setNotice(null)
    try {
      await deposerIntention(session.user.id, contenu.trim(), isPublic, estAnonyme)
      setContenu('')
      setNotice('Merci — votre intention a été confiée à la prière de la communauté.')
      loadIntentions()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Ressourcement &amp; Formation</p>
          <h1>Vie <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Spirituelle</em></h1>
        </div>
      </div>

      <div className="verse-band">
        <blockquote>
          La vie spirituelle n'est pas une fuite du monde, mais une plongée plus profonde dans la réalité de Dieu au cœur de notre vie.
          <cite className="verse-ref">— Aumônerie de la cathédrale</cite>
        </blockquote>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner">

          <div className="reveal" style={{ maxWidth: 560, marginBottom: 48 }}>
            <span className="section-label">Académie des laïcs</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>
              Formations <em style={{ color: 'var(--blue)', fontStyle: 'italic' }}>théologiques</em>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'var(--space-xl)' }}>
            {FORMATIONS.map((f, i) => (
              <div key={i} className="reveal formation-item" style={{
                display: 'grid', gridTemplateColumns: '64px 1fr auto',
                alignItems: 'stretch', gap: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                transition: 'border-color .2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(193,164,97,.2)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(193,164,97,.07)'}
              >
                <div className="formation-num" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--v2-font-serif)', fontSize: 28, fontWeight: 700, color: 'rgba(193,164,97,.2)', borderRight: '1px solid rgba(193,164,97,.08)' }}>{f.num}</div>
                <div style={{ padding: '28px 28px' }}>
                  <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 6 }}>{f.tag}</span>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8, lineHeight: 1.3 }}>{f.titre}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
                <div className="formation-meta" style={{ padding: '28px 24px', borderLeft: '1px solid rgba(193,164,97,.08)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 5, minWidth: 160 }}>
                  <span style={{ fontFamily: 'var(--v2-font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--blue)', textAlign: 'right' }}>{f.horaire}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-light)', textAlign: 'right' }}>{f.lieu}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ maxWidth: 560, marginBottom: 48 }}>
            <span className="section-label">Prières &amp; Dévotions</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>
              Prières de la <em style={{ color: 'var(--blue)', fontStyle: 'italic' }}>communauté</em>
            </h2>
          </div>

          <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
            {PRIERES.map((p, i) => {
              const open = openPriere === i
              return (
                <button
                  key={p.titre}
                  onClick={() => setOpenPriere(open ? null : i)}
                  className="reveal dark-card"
                  style={{ textAlign: 'left', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 26 }}>{p.icon}</span>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{p.titre}</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-light)' }}>{p.sous}</p>
                  {open && (
                    <p style={{ fontSize: 12, color: 'var(--text-mid)', fontStyle: 'italic', lineHeight: 1.7, marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      {p.texte}
                    </p>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--blue)', marginTop: 'auto' }}>
                    {open ? 'Réduire' : 'Lire'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="reveal" style={{ maxWidth: 560, marginBottom: 48 }}>
            <span className="section-label">Groupes et mouvements</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>
              Vivre la foi <em style={{ color: 'var(--blue)', fontStyle: 'italic' }}>en communauté</em>
            </h2>
          </div>

          {loadingGroupes ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Chargement…</p>
          ) : groupes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Les groupes seront bientôt annoncés ici.</p>
          ) : (
            <div className="groupes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, background: 'rgba(193,164,97,.06)' }}>
              {groupes.map((g) => (
                <div key={g.id} className="reveal" style={{ background: 'var(--bg-alt)', padding: '36px 28px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'background .3s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-alt)'}
                >
                  <span style={{ fontSize: 30 }}>{g.icon}</span>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{g.titre}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300, lineHeight: 1.7, flex: 1 }}>{g.description}</p>
                  {g.responsable && <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Responsable : {g.responsable}</span>}
                  {g.horaire && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-dark)', letterSpacing: '.04em' }}>{g.horaire}</span>}
                  {g.contact && (
                    <a href={contactHref(g.contact)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textDecoration: 'underline', letterSpacing: '.04em' }}>
                      Contacter le responsable
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="reveal" style={{ maxWidth: 560, marginTop: 'var(--space-xl)', marginBottom: 32 }}>
            <span className="section-label">Confier une intention</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>
              Intentions de la <em style={{ color: 'var(--blue)', fontStyle: 'italic' }}>communauté</em>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 32, alignItems: 'start' }} className="intentions-grid">
            <div className="reveal" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-accent)', borderRadius: 'var(--r-md)', padding: 28 }}>
              <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.8, marginBottom: 18 }}>
                Confiez une épreuve, une action de grâce ou un proche à la prière des prêtres et de la communauté paroissiale.
              </p>

              {session === undefined ? null : session ? (
                <>
                  <textarea
                    value={contenu}
                    onChange={(e) => setContenu(e.target.value)}
                    placeholder="Écrivez votre intention de prière..."
                    maxLength={500}
                    rows={4}
                    className="dark-input"
                    style={{ width: '100%', resize: 'vertical', paddingTop: 10, fontFamily: 'var(--v2-font-sans)' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-light)', marginTop: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                    Visible sur le mur de la communauté
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-light)', marginTop: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={estAnonyme} onChange={(e) => setEstAnonyme(e.target.checked)} />
                    Rester anonyme, même pour l'équipe pastorale
                  </label>
                  {notice && <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 10 }}>{notice}</p>}
                  <button
                    onClick={submitIntention}
                    disabled={submitting || contenu.trim().length < 3}
                    className="btn-gold"
                    style={{ marginTop: 16, width: '100%', justifyContent: 'center', opacity: submitting || contenu.trim().length < 3 ? .6 : 1 }}
                  >
                    <Send size={15} /> {submitting ? 'Envoi…' : 'Confier cette intention'}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 14 }}>
                  <Lock size={16} color="var(--text-light)" />
                  <p style={{ fontSize: 12, color: 'var(--text-light)', flex: 1 }}>Connectez-vous pour déposer une intention.</p>
                  <button onClick={() => navigate('/connexion')} className="btn-outline" style={{ padding: '7px 14px', fontSize: 11, flexShrink: 0 }}>Se connecter</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingIntentions ? (
                <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Chargement…</p>
              ) : intentions.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Aucune intention partagée pour le moment.</p>
              ) : (
                intentions.map(it => (
                  <div key={it.id} className="reveal" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '16px 18px' }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.7 }}>{it.contenu}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-light)', marginTop: 8 }}>{formatDate(it.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
