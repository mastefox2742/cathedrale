'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Church, Star, Route, ShieldCheck, History, Pencil } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useParoisse } from '../contexts/ParoisseContext'
import { majMonProfil, PARISH_STAFF_ROLES, ROLE_LABELS } from '../services/auth'
import { definirParoissePrincipale, quitterParoisse } from '../services/paroisses'
import { getMesParcours, getParcoursPublies, type ProgressionParcours, type Parcours } from '../services/parcours'
import { getMesDemandes, TYPE_DEMANDE_LABELS, STATUT_DEMANDE_LABELS, type DemandePastorale } from '../services/demandesPastorales'
import { getMesDons, formatXAF, STATUT_DON_LABELS, type Don } from '../services/dons'
import { getMesIntentions, type PrayerIntention } from '../services/prieres'
import { getMesTemoignages, STATUT_TEMOIGNAGE_LABELS, type Temoignage } from '../services/temoignages'

const titreStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-mid)', marginTop: 26, marginBottom: 10,
}

const ligneStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--text)',
}

const badge = (ok: boolean): CSSProperties => ({
  fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--r-full)', flexShrink: 0,
  background: ok ? 'rgba(46,125,91,.1)' : 'rgba(200,155,60,.1)', color: ok ? '#2E7D5B' : 'var(--accent-dark)',
})

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Informations personnelles, paroisses, parcours de foi, formations obligatoires et historique. */
export function ProfilSections() {
  const { user, profile, appartenances, refresh } = useAuth()
  const { paroisses } = useParoisse()
  const [edition, setEdition] = useState(false)
  const [nom, setNom] = useState(profile?.nom ?? '')
  const [telephone, setTelephone] = useState(profile?.telephone ?? '')
  const [parcours, setParcours] = useState<ProgressionParcours[]>([])
  const [obligatoires, setObligatoires] = useState<Parcours[]>([])
  const [demandes, setDemandes] = useState<DemandePastorale[]>([])
  const [dons, setDons] = useState<Don[]>([])
  const [intentions, setIntentions] = useState<PrayerIntention[]>([])
  const [temoignages, setTemoignages] = useState<Temoignage[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  const mesRolesStaff = appartenances.filter(a => PARISH_STAFF_ROLES.includes(a.role)).map(a => a.role)

  useEffect(() => {
    if (!user) return
    getMesParcours(user.id).then(setParcours).catch(() => {})
    getMesDemandes(user.id).then(setDemandes).catch(() => {})
    getMesDons(user.id).then(setDons).catch(() => {})
    getMesIntentions(user.id).then(setIntentions).catch(() => {})
    getMesTemoignages(user.id).then(setTemoignages).catch(() => {})
  }, [user])

  useEffect(() => {
    if (mesRolesStaff.length === 0) return
    getParcoursPublies(['formation_staff'])
      .then(p => setObligatoires(p.filter(x => x.obligatoirePour.some(r => mesRolesStaff.includes(r)))))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesRolesStaff.join(',')])

  useEffect(() => { setNom(profile?.nom ?? ''); setTelephone(profile?.telephone ?? '') }, [profile])

  async function enregistrer() {
    try {
      await majMonProfil(nom, telephone)
      await refresh()
      setEdition(false)
      setNotice('Informations mises à jour.')
    } catch { setNotice('Une erreur est survenue.') }
  }

  async function principale(id: string) {
    try { await definirParoissePrincipale(id); await refresh() } catch { setNotice('Une erreur est survenue.') }
  }

  async function quitter(id: string) {
    try { await quitterParoisse(id); await refresh() } catch { setNotice('Une erreur est survenue.') }
  }

  if (!user) return null

  const parParoisse = new Map<string, { principale: boolean; roles: string[] }>()
  for (const a of appartenances) {
    const cur = parParoisse.get(a.parishId) ?? { principale: false, roles: [] }
    cur.principale ||= a.principale
    if (a.role !== 'membre') cur.roles.push(ROLE_LABELS[a.role])
    parParoisse.set(a.parishId, cur)
  }
  const nomParoisse = (id: string) => paroisses.find(p => p.id === id)?.nom ?? 'Paroisse'
  const faitsParId = new Map(parcours.map(p => [p.parcours.id, p]))

  return (
    <>
      {notice && <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 18 }}>{notice}</p>}

      {/* ── Informations ── */}
      <p style={titreStyle}><Pencil size={13} /> Mes informations</p>
      {edition ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom et prénom" className="dark-input" />
          <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="Téléphone" className="dark-input" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEdition(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: 10 }}>Annuler</button>
            <button onClick={enregistrer} className="btn-gold" style={{ flex: 1, justifyContent: 'center', fontSize: 10 }}>Enregistrer</button>
          </div>
        </div>
      ) : (
        <div style={ligneStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600 }}>{profile?.nom || 'Nom non renseigné'}</p>
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{profile?.telephone || 'Téléphone non renseigné'}</p>
          </div>
          <button onClick={() => setEdition(true)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Modifier</button>
        </div>
      )}

      {/* ── Paroisses ── */}
      <p style={titreStyle}><Church size={13} /> Mes paroisses</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...parParoisse.entries()].map(([id, info]) => (
          <div key={id} style={ligneStyle}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600 }}>{nomParoisse(id)}</p>
              {info.roles.length > 0 && <p style={{ fontSize: 11, color: 'var(--text-light)' }}>{info.roles.join(' · ')}</p>}
            </div>
            {info.principale ? (
              <span style={badge(true)}><Star size={10} style={{ verticalAlign: -1 }} /> Principale</span>
            ) : (
              <>
                <button onClick={() => principale(id)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Principale</button>
                {info.roles.length === 0 && (
                  <button onClick={() => quitter(id)} style={{ background: 'none', border: 'none', color: '#B54747', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Quitter</button>
                )}
              </>
            )}
          </div>
        ))}
        <Link href="/paroisses" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>+ Rejoindre une autre paroisse</Link>
      </div>

      {/* ── Parcours de foi ── */}
      <p style={titreStyle}><Route size={13} /> Mes parcours de foi</p>
      {parcours.filter(p => p.parcours.type !== 'formation_staff').length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Aucun parcours commencé. <Link href="/decouvrir-la-foi" style={{ color: 'var(--blue)' }}>Découvrir les parcours</Link></p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {parcours.filter(p => p.parcours.type !== 'formation_staff').map(p => (
            <div key={p.parcours.id} style={ligneStyle}>
              <span style={{ fontSize: 18 }}>{p.parcours.emoji}</span>
              <Link href={`/parcours/${p.parcours.slug}`} style={{ flex: 1, minWidth: 0, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.parcours.titre}
              </Link>
              <span style={badge(!!p.termineLe)}>{p.termineLe ? 'Terminé' : `${p.faites}/${p.total}`}</span>
              {p.termineLe && <Link href={`/parcours/${p.parcours.slug}/attestation`} style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)' }}>Attestation</Link>}
            </div>
          ))}
        </div>
      )}

      {/* ── Formations obligatoires (staff) ── */}
      {obligatoires.length > 0 && (
        <>
          <p style={titreStyle}><ShieldCheck size={13} /> Formations obligatoires</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {obligatoires.map(o => {
              const prog = faitsParId.get(o.id)
              return (
                <div key={o.id} style={ligneStyle}>
                  <span style={{ fontSize: 18 }}>{o.emoji}</span>
                  <Link href={`/parcours/${o.slug}`} style={{ flex: 1, minWidth: 0, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>{o.titre}</Link>
                  <span style={badge(!!prog?.termineLe)}>{prog?.termineLe ? 'Validée' : 'À suivre'}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Historique ── */}
      {(demandes.length + dons.length + intentions.length + temoignages.length) > 0 && (
        <>
          <p style={titreStyle}><History size={13} /> Mon historique</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {demandes.map(d => (
              <div key={d.id} style={ligneStyle}>
                <span style={{ flex: 1, minWidth: 0 }}>📋 {TYPE_DEMANDE_LABELS[d.type]} <span style={{ color: 'var(--text-light)', fontSize: 11 }}>· {d.reference}</span></span>
                <span style={badge(d.statut === 'traitee')}>{STATUT_DEMANDE_LABELS[d.statut]}</span>
              </div>
            ))}
            {dons.map(d => (
              <div key={d.id} style={ligneStyle}>
                <span style={{ flex: 1 }}>💝 Don de {formatXAF(d.montant)} <span style={{ color: 'var(--text-light)', fontSize: 11 }}>· {d.createdAt ? fmt(d.createdAt) : ''}</span></span>
                <span style={badge(d.statut === 'confirme')}>{STATUT_DON_LABELS[d.statut]}</span>
              </div>
            ))}
            {intentions.map(i => (
              <div key={i.id} style={ligneStyle}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🙏 {i.contenu}</span>
                <span style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0 }}>{fmt(i.created_at)}</span>
              </div>
            ))}
            {temoignages.map(t => (
              <div key={t.id} style={ligneStyle}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✍️ {t.contenu}</span>
                <span style={badge(t.statut === 'approuve')}>{STATUT_TEMOIGNAGE_LABELS[t.statut]}</span>
              </div>
            ))}
          </div>
        </>
      )}

    </>
  )
}
