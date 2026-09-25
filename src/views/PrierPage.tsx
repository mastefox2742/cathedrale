'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useNavigate } from '../lib/navigation'
import { BookOpen, Send, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getIntentionsPubliques, deposerIntention, prierPour, type PrayerIntention } from '../services/prieres'
import { getParcoursPublies, type Parcours } from '../services/parcours'
import { getGroupes, type Groupe } from '../services/groupes'
import { getHomelies, type Homelie } from '../services/homelies'
import { AdhesionModal } from '../components/AdhesionModal'

// ── Liturgie des heures (AELF) ──────────────────────────────────────────────

const OFFICES = [
  { key: 'laudes', label: 'Laudes', moment: 'Prière du matin' },
  { key: 'sexte', label: 'Milieu du jour', moment: 'Vers midi' },
  { key: 'vepres', label: 'Vêpres', moment: 'Prière du soir' },
  { key: 'complies', label: 'Complies', moment: 'Avant le coucher' },
] as const

type OfficeKey = typeof OFFICES[number]['key']

interface PartieOffice { titre: string; html: string }

const BALISES_AUTORISEES = new Set(['P', 'BR', 'H4', 'H5', 'U', 'STRONG', 'EM', 'B', 'I', 'SPAN'])

/** Recopie le HTML d'AELF en ne gardant que des balises de mise en forme, sans attributs. */
function assainir(source: Element): string {
  const out = document.createElement('div')
  function copier(from: Node, to: Node) {
    from.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) { to.appendChild(document.createTextNode(n.textContent ?? '')); return }
      if (n.nodeType !== Node.ELEMENT_NODE) return
      const el = n as Element
      if (BALISES_AUTORISEES.has(el.tagName)) {
        const copie = document.createElement(el.tagName === 'SPAN' ? 'sup' : el.tagName.toLowerCase())
        copier(el, copie)
        to.appendChild(copie)
      } else {
        copier(el, to)
      }
    })
  }
  copier(source, out)
  return out.innerHTML
}

async function chargerOffice(office: OfficeKey): Promise<PartieOffice[]> {
  const date = new Date().toISOString().slice(0, 10)
  const url = `/api/aelf?date=${date}&office=${office}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
  return Array.from(doc.querySelectorAll('.lecture')).map(el => {
    const clone = el.cloneNode(true) as Element
    const titre = clone.querySelector('h4')?.textContent?.trim() ?? ''
    clone.querySelector('h4')?.remove()
    clone.querySelectorAll('.lecture_link').forEach(x => x.remove())
    return { titre, html: assainir(clone) }
  }).filter(p => p.html.trim().length > 0)
}

// ── Chapelet ────────────────────────────────────────────────────────────────

const MYSTERES = {
  joyeux: { nom: 'Mystères joyeux', liste: ["L'Annonciation", 'La Visitation', 'La Nativité', 'La Présentation de Jésus au Temple', 'Le Recouvrement de Jésus au Temple'] },
  lumineux: { nom: 'Mystères lumineux', liste: ['Le Baptême de Jésus', 'Les Noces de Cana', "L'Annonce du Royaume", 'La Transfiguration', "L'Institution de l'Eucharistie"] },
  douloureux: { nom: 'Mystères douloureux', liste: "L'Agonie au jardin des Oliviers|La Flagellation|Le Couronnement d'épines|Le Portement de la Croix|La Crucifixion".split('|') },
  glorieux: { nom: 'Mystères glorieux', liste: ['La Résurrection', "L'Ascension", 'La Pentecôte', "L'Assomption de la Vierge Marie", 'Le Couronnement de la Vierge Marie'] },
}

/** Répartition traditionnelle : lundi/samedi joyeux, mardi/vendredi douloureux, mercredi/dimanche glorieux, jeudi lumineux. */
function mysteresDuJour(jour: number) {
  if (jour === 1 || jour === 6) return MYSTERES.joyeux
  if (jour === 2 || jour === 5) return MYSTERES.douloureux
  if (jour === 4) return MYSTERES.lumineux
  return MYSTERES.glorieux
}

const ETAPES_CHAPELET = [
  'Signe de croix et Credo',
  'Un Notre Père, trois Je vous salue Marie, un Gloire au Père',
  'Pour chaque mystère : annoncer le mystère, un Notre Père, dix Je vous salue Marie, un Gloire au Père',
  'Terminer par le Salve Regina',
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function PrierPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [office, setOffice] = useState<OfficeKey>('laudes')
  const [parties, setParties] = useState<PartieOffice[]>([])
  const [officeEtat, setOfficeEtat] = useState<'chargement' | 'ok' | 'erreur'>('chargement')
  const [intentions, setIntentions] = useState<PrayerIntention[]>([])
  const [dejaPrie, setDejaPrie] = useState<Set<string>>(new Set())
  const [contenu, setContenu] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [anonyme, setAnonyme] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [neuvaines, setNeuvaines] = useState<Parcours[]>([])
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [meditation, setMeditation] = useState<Homelie | null>(null)
  const [adhesion, setAdhesion] = useState<Groupe | null>(null)

  const mysteres = mysteresDuJour(new Date().getDay())

  useEffect(() => {
    getIntentionsPubliques().then(setIntentions).catch(() => setIntentions([]))
    getParcoursPublies(['neuvaine', 'retraite']).then(setNeuvaines).catch(() => setNeuvaines([]))
    getGroupes().then(g => setGroupes(g.filter(x => ['priere', 'biblique', 'liturgie'].includes(x.categorie)))).catch(() => setGroupes([]))
    getHomelies().then(h => setMeditation(h[0] ?? null)).catch(() => setMeditation(null))
  }, [])

  useEffect(() => {
    setOfficeEtat('chargement')
    chargerOffice(office).then(p => { setParties(p); setOfficeEtat('ok') }).catch(() => setOfficeEtat('erreur'))
  }, [office])

  async function prier(i: PrayerIntention) {
    if (dejaPrie.has(i.id)) return
    setDejaPrie(s => new Set(s).add(i.id))
    try {
      const n = await prierPour(i.id)
      setIntentions(list => list.map(x => x.id === i.id ? { ...x, nb_prieres: n } : x))
    } catch { /* compteur indicatif */ }
  }

  async function deposer() {
    if (!user) { navigate('/connexion'); return }
    if (contenu.trim().length < 3) return
    setEnvoi(true)
    setNotice(null)
    try {
      await deposerIntention(user.id, contenu.trim(), isPublic, anonyme)
      setContenu('')
      setNotice('Votre intention a été confiée à la communauté. Que Dieu vous bénisse.')
      getIntentionsPubliques().then(setIntentions).catch(() => {})
    } catch {
      setNotice('Une erreur est survenue. Merci de réessayer.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Vie de prière</p>
          <h1>Je veux <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>prier</em></h1>
        </div>
      </div>

      {/* ══ SOMMAIRE ══ */}
      <div style={{ background: 'var(--primary)', padding: '14px var(--pad-x)' }}>
        <div className="inner" style={{ padding: 0, display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['#evangile', 'Évangile du jour'], ['#heures', 'Liturgie des heures'], ['#chapelet', 'Chapelet'], ['#mur', 'Mur de prière'], ['#neuvaines', 'Neuvaines'], ['#groupes', 'Groupes de prière']].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-light)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
      </div>

      {/* ══ ÉVANGILE DU JOUR & MÉDITATION ══ */}
      <section id="evangile" style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)', scrollMarginTop: 80 }}>
        <div className="inner grid-2" style={{ gap: 'clamp(20px,4vw,48px)' }}>
          <div className="reveal dark-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="icon-tile" style={{ background: 'var(--primary)', color: '#fff' }}><BookOpen size={22} /></div>
            <span className="section-label">Évangile du jour</span>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, flex: 1 }}>
              Les lectures de la messe du jour, d'après la traduction liturgique officielle (AELF).
            </p>
            <Link href="/liturgie" className="btn-gold" style={{ alignSelf: 'flex-start' }}>Lire l'Évangile du jour</Link>
          </div>
          <div className="reveal dark-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="section-label">Méditation</span>
            {meditation ? (
              <>
                <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>{meditation.titre}</h3>
                <p style={{ fontSize: 11, color: 'var(--accent-dark)', fontWeight: 700 }}>{meditation.pretre}</p>
                <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, flex: 1 }}>
                  {meditation.texte.slice(0, 260)}{meditation.texte.length > 260 ? '…' : ''}
                </p>
                <Link href="/homelies" className="btn-outline" style={{ alignSelf: 'flex-start', fontSize: 10 }}>Lire la méditation →</Link>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-light)' }}>La méditation de la semaine sera publiée prochainement.</p>
            )}
          </div>
        </div>
      </section>

      {/* ══ LITURGIE DES HEURES ══ */}
      <section id="heures" style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)', scrollMarginTop: 80 }}>
        <div className="inner" style={{ maxWidth: 820 }}>
          <div className="reveal" style={{ marginBottom: 24 }}>
            <span className="section-label">Prière de l'Église</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: 'var(--text)' }}>Liturgie des heures</h2>
          </div>
          <div style={{ display: 'flex', gap: 2, marginBottom: 24, flexWrap: 'wrap' }}>
            {OFFICES.map(o => (
              <button key={o.key} onClick={() => setOffice(o.key)} style={{
                padding: '9px 18px', cursor: 'pointer', border: '1px solid var(--border-accent)',
                background: office === o.key ? 'var(--gold)' : 'var(--anthracite)',
                color: office === o.key ? 'var(--black)' : 'var(--grey)',
                fontFamily: 'var(--v2-font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
              }}>
                {o.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 20 }}>{OFFICES.find(o => o.key === office)?.moment} · Texte : AELF</p>

          {officeEtat === 'chargement' && <div className="page-loader"><div className="page-loader-ring" /></div>}
          {officeEtat === 'erreur' && (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
              L'office n'a pas pu être chargé. <a href={`https://www.aelf.org/${new Date().toISOString().slice(0, 10)}/romain/${office}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)' }}>Le lire sur aelf.org ↗</a>
            </p>
          )}
          {officeEtat === 'ok' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {parties.map((p, i) => (
                <details key={`${office}-${i}`} open={i < 2} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px 22px' }}>
                  <summary style={{ cursor: 'pointer', fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>{p.titre || 'Office'}</summary>
                  <div className="office-texte" style={{ marginTop: 12, fontFamily: 'var(--v2-font-serif)', fontSize: 15, lineHeight: 1.8, color: 'var(--text)' }}
                    dangerouslySetInnerHTML={{ __html: p.html }} />
                </details>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ CHAPELET ══ */}
      <section id="chapelet" style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)', scrollMarginTop: 80 }}>
        <div className="inner grid-2" style={{ gap: 'clamp(24px,5vw,64px)', alignItems: 'start' }}>
          <div className="reveal">
            <span className="section-label">Le chapelet du jour</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>📿 {mysteres.nom}</h2>
            <ol style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mysteres.liste.map((m, i) => (
                <li key={m} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 18px', background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--blue)', minWidth: 22 }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: 'var(--text)' }}>{m}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="reveal" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-accent)', padding: 28 }}>
            <span className="section-label">Comment prier le chapelet</span>
            <ol style={{ margin: '12px 0 0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ETAPES_CHAPELET.map(e => <li key={e} style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7 }}>{e}</li>)}
            </ol>
            <blockquote style={{ fontFamily: 'var(--v2-font-serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, borderLeft: '3px solid var(--blue)', paddingLeft: 16, marginTop: 20 }}>
              Je vous salue Marie, pleine de grâce ; le Seigneur est avec vous. Vous êtes bénie entre toutes les femmes, et Jésus, le fruit de vos entrailles, est béni. Sainte Marie, Mère de Dieu, priez pour nous, pauvres pécheurs, maintenant et à l'heure de notre mort. Amen.
            </blockquote>
          </div>
        </div>
      </section>

      {/* ══ MUR DE PRIÈRE ══ */}
      <section id="mur" style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)', scrollMarginTop: 80 }}>
        <div className="inner" style={{ maxWidth: 820 }}>
          <div className="reveal" style={{ marginBottom: 24 }}>
            <span className="section-label">Communion de prière</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: 'var(--text)' }}>Mur de prière</h2>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 8, lineHeight: 1.7 }}>Confiez une intention, et priez pour celles des autres.</p>
          </div>

          <div className="reveal" style={{ background: 'var(--surface)', border: '1px solid var(--border-accent)', padding: 24, marginBottom: 32 }}>
            <textarea value={contenu} onChange={e => setContenu(e.target.value)} rows={3} maxLength={500}
              placeholder="Écrivez votre intention de prière…" className="dark-input" style={{ width: '100%', resize: 'vertical', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-light)', cursor: 'pointer' }}>
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /> Afficher sur le mur de prière
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-light)', cursor: 'pointer' }}>
                <input type="checkbox" checked={anonyme} onChange={e => setAnonyme(e.target.checked)} /> Anonyme
              </label>
            </div>
            {notice && <p style={{ fontSize: 12, color: 'var(--blue)', marginBottom: 12 }}>{notice}</p>}
            <button onClick={deposer} disabled={envoi || (!!user && contenu.trim().length < 3)} className="btn-gold" style={{ width: '100%', justifyContent: 'center', opacity: envoi ? .6 : 1 }}>
              {user ? <><Send size={14} /> {envoi ? 'Envoi…' : 'Confier mon intention'}</> : <><Lock size={14} /> Se connecter pour déposer une intention</>}
            </button>
          </div>

          {intentions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Aucune intention publique pour le moment.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {intentions.map(i => (
                <div key={i.id} className="reveal" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.7, flex: 1 }}>« {i.contenu} »</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{formatDate(i.created_at)}</span>
                    <button onClick={() => prier(i)} disabled={dejaPrie.has(i.id)} style={{
                      padding: '5px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700, cursor: dejaPrie.has(i.id) ? 'default' : 'pointer',
                      border: '1.5px solid var(--border-accent)',
                      background: dejaPrie.has(i.id) ? 'var(--primary)' : 'transparent',
                      color: dejaPrie.has(i.id) ? '#fff' : 'var(--primary)',
                    }}>
                      🙏 {dejaPrie.has(i.id) ? 'Je prie' : 'Je prie pour'}{i.nb_prieres ? ` · ${i.nb_prieres}` : ''}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ NEUVAINES & RETRAITES ══ */}
      <section id="neuvaines" style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)', scrollMarginTop: 80 }}>
        <div className="inner">
          <div className="reveal" style={{ marginBottom: 32 }}>
            <span className="section-label">En ligne</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: 'var(--text)' }}>Neuvaines &amp; retraites</h2>
          </div>
          {neuvaines.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Les neuvaines et retraites en ligne seront proposées prochainement.</p>
          ) : (
            <div className="grid-3">
              {neuvaines.map(p => (
                <Link key={p.id} href={`/parcours/${p.slug}`} className="dark-card reveal" style={{ padding: 26, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>{p.emoji}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', color: 'var(--accent-dark)', textTransform: 'uppercase' }}>
                    {p.type === 'neuvaine' ? 'Neuvaine' : 'Retraite'}{p.duree ? ` · ${p.duree}` : ''}
                  </span>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{p.titre}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, flex: 1 }}>{p.description}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)' }}>
                    Commencer <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ GROUPES DE PRIÈRE ══ */}
      <section id="groupes" style={{ padding: 'var(--space-xl) 0', background: 'var(--bg-alt)', scrollMarginTop: 80 }}>
        <div className="inner">
          <div className="reveal" style={{ marginBottom: 32 }}>
            <span className="section-label">Prier ensemble</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: 'var(--text)' }}>Groupes de prière</h2>
          </div>
          {groupes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Les groupes de prière seront bientôt annoncés ici. <Link href="/vie-spirituelle" style={{ color: 'var(--blue)' }}>Voir tous les groupes</Link></p>
          ) : (
            <div className="grid-3">
              {groupes.map(g => (
                <div key={g.id} className="dark-card reveal" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{g.icon}</span>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{g.titre}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, flex: 1 }}>{g.description}</p>
                  {g.horaire && <p style={{ fontSize: 11, color: 'var(--accent-dark)', fontWeight: 700 }}>{g.horaire}</p>}
                  <button onClick={() => setAdhesion(g)} className="btn-outline" style={{ fontSize: 10, alignSelf: 'flex-start' }}>Rejoindre ce groupe</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {adhesion && <AdhesionModal groupe={adhesion} onClose={() => setAdhesion(null)} />}

      <style>{`
        .office-texte h5 { font-size: 13px; color: var(--accent-dark); margin: 12px 0 4px; }
        .office-texte p { margin-bottom: 10px; }
        .office-texte sup { font-size: 10px; color: var(--text-light); margin-right: 3px; }
        .office-texte u { text-decoration: none; font-weight: 700; }
      `}</style>
    </>
  )
}
