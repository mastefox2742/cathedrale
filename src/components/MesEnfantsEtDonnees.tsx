'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Baby, Download, Trash2, ShieldCheck } from 'lucide-react'
import { getSuiviMesEnfants, STATUT_PRESENCE_LABELS, type SuiviEnfantParent } from '../services/suiviEnfants'
import { exporterMesDonnees, supprimerMonCompte } from '../services/archidiocese'

const titreStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-mid)', marginTop: 26, marginBottom: 10,
}

/** Suivi des enfants (vue parent) + droits sur les données personnelles. */
export function MesEnfantsEtDonnees({ userId }: { userId: string }) {
  const [enfants, setEnfants] = useState<SuiviEnfantParent[]>([])
  const [confirmer, setConfirmer] = useState(false)
  const [texteConfirmation, setTexteConfirmation] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    getSuiviMesEnfants(userId).then(setEnfants).catch(() => setEnfants([]))
  }, [userId])

  async function exporter() {
    setErreur(null)
    try {
      const donnees = await exporterMesDonnees()
      const url = URL.createObjectURL(new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch { setErreur("L'export a échoué. Merci de réessayer.") }
  }

  async function supprimer() {
    setEnCours(true)
    setErreur(null)
    try {
      await supprimerMonCompte()
      window.location.assign('/')
    } catch {
      setErreur('La suppression a échoué. Merci de contacter le secrétariat.')
      setEnCours(false)
    }
  }

  return (
    <>
      {enfants.length > 0 && (
        <>
          <p style={titreStyle}><Baby size={13} /> Mes enfants</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {enfants.map(e => {
              const valides = e.modules.filter(m => m.valide).length
              const presents = e.presences.filter(p => p.statut === 'present').length
              return (
                <div key={e.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 14 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{e.prenom} {e.nom}</p>
                  {e.cours ? (
                    <>
                      <p style={{ fontSize: 12, color: 'var(--text-light)', margin: '2px 0 10px' }}>{e.cours.emoji} {e.cours.titre} · {valides}/{e.modules.length} modules validés</p>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-alt)', borderRadius: 'var(--r-full)', overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${e.modules.length ? (valides / e.modules.length) * 100 : 0}%`, background: 'linear-gradient(90deg, var(--accent), var(--primary-mid))' }} />
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {e.modules.map(m => (
                          <span key={m.id} title={m.titre} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 'var(--r-full)', background: m.valide ? 'rgba(46,125,91,.1)' : 'var(--bg-alt)', color: m.valide ? '#2E7D5B' : 'var(--text-light)' }}>
                            {m.valide ? '✓ ' : ''}{m.ordre}. {m.titre}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Pas encore inscrit à un parcours de catéchèse.</p>
                  )}
                  {e.presences.length > 0 && (
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ fontSize: 12, color: 'var(--blue)', cursor: 'pointer' }}>Présences : {presents}/{e.presences.length} séances</summary>
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {e.presences.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-mid)' }}>
                            <span>{p.date ? new Date(p.date + 'T12:00:00').toLocaleDateString('fr-FR') : ''} · {p.objectifs}</span>
                            <strong style={{ color: p.statut === 'present' ? '#2E7D5B' : p.statut === 'excuse' ? 'var(--accent-dark)' : '#B54747' }}>{STATUT_PRESENCE_LABELS[p.statut]}</strong>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <p style={titreStyle}><ShieldCheck size={13} /> Mes données personnelles</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={exporter} className="btn-outline" style={{ justifyContent: 'center', fontSize: 10 }}>
          <Download size={13} /> Télécharger mes données
        </button>
        {!confirmer ? (
          <button onClick={() => setConfirmer(true)} style={{ background: 'none', border: 'none', color: '#B54747', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 6 }}>
            Supprimer mon compte
          </button>
        ) : (
          <div style={{ border: '1px solid #B54747', borderRadius: 'var(--r-sm)', padding: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, marginBottom: 10 }}>
              Votre compte, votre profil, vos paroisses, vos intentions et votre progression seront supprimés définitivement.
              Vos dons et démarches restent enregistrés par la paroisse, sans lien avec votre compte.
              Tapez <strong>SUPPRIMER</strong> pour confirmer.
            </p>
            <input value={texteConfirmation} onChange={e => setTexteConfirmation(e.target.value)} className="dark-input" aria-label="Confirmation de suppression" style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setConfirmer(false); setTexteConfirmation('') }} className="btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: 10 }}>Annuler</button>
              <button onClick={supprimer} disabled={texteConfirmation !== 'SUPPRIMER' || enCours}
                style={{ flex: 1, border: 'none', borderRadius: 'var(--r-md)', background: '#B54747', color: '#fff', fontWeight: 700, fontSize: 11, cursor: texteConfirmation === 'SUPPRIMER' ? 'pointer' : 'not-allowed', opacity: texteConfirmation === 'SUPPRIMER' ? 1 : .5 }}>
                <Trash2 size={12} style={{ verticalAlign: -2 }} /> {enCours ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
        {erreur && <p style={{ fontSize: 12, color: '#B54747' }}>{erreur}</p>}
      </div>
    </>
  )
}
