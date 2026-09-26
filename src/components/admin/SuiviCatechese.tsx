'use client'

import { useEffect, useState } from 'react'
import { getEnfants, type Enfant } from '../../services/enfants'
import { getModules, type Module } from '../../services/catechisme'
import {
  getPresencesSeance, noterPresence, getModulesValides, basculerModuleValide, lierCompteParent, getPresencesEnfant,
  STATUT_PRESENCE_LABELS, type StatutPresence,
} from '../../services/suiviEnfants'
import type { SeanceCatechisme } from '../../services/seancesCatechisme'
import { Modale, inp, Pastille } from './ui'

const COULEURS: Record<StatutPresence, { bg: string; fg: string }> = {
  present: { bg: '#e8f5e9', fg: '#2e7d32' },
  absent: { bg: '#ffebee', fg: '#c62828' },
  excuse: { bg: 'rgba(245,127,23,.12)', fg: '#e65100' },
}

/** Feuille de présence d'une séance : enfants inscrits au cours de la séance. */
export function PresencesModale({ seance, titre, onClose, notifier }: {
  seance: SeanceCatechisme; titre: string; onClose: () => void; notifier: (m: string, t?: 'ok' | 'err') => void
}) {
  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [statuts, setStatuts] = useState<Map<string, StatutPresence>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getEnfants(), getPresencesSeance(seance.id!)])
      .then(([e, p]) => {
        setEnfants(e.filter(x => x.actif && x.coursId === seance.coursId))
        setStatuts(new Map(p.map(x => [x.enfantId, x.statut])))
      })
      .catch(() => notifier('Erreur de chargement', 'err'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seance])

  async function noter(enfantId: string, statut: StatutPresence) {
    const avant = statuts.get(enfantId)
    setStatuts(m => new Map(m).set(enfantId, statut))
    try { await noterPresence(seance.id!, enfantId, statut) }
    catch {
      setStatuts(m => { const n = new Map(m); if (avant) n.set(enfantId, avant); else n.delete(enfantId); return n })
      notifier('Erreur', 'err')
    }
  }

  const presents = [...statuts.values()].filter(s => s === 'present').length

  return (
    <Modale titre={`Présences — ${titre}`} onClose={onClose} maxWidth={620}>
      <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
        {new Date(seance.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {presents}/{enfants.length} présent{presents > 1 ? 's' : ''}
      </p>
      {loading ? <p style={{ fontSize: 13 }}>Chargement…</p> : enfants.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Aucun enfant inscrit à ce cours (voir « Suivi Parent-Enfant »).</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {enfants.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--surface-container)' }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{e.prenom} {e.nom}</span>
              {(Object.keys(STATUT_PRESENCE_LABELS) as StatutPresence[]).map(s => {
                const actif = statuts.get(e.id!) === s
                return (
                  <button key={s} onClick={() => noter(e.id!, s)} aria-pressed={actif}
                    style={{ padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: actif ? COULEURS[s].fg : COULEURS[s].bg, color: actif ? 'white' : COULEURS[s].fg }}>
                    {STATUT_PRESENCE_LABELS[s]}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn-outline" onClick={onClose}>Fermer</button>
      </div>
    </Modale>
  )
}

/** Suivi d'un enfant : compte du parent, modules validés, présences. */
export function SuiviEnfant({ enfant, notifier, onChange }: { enfant: Enfant; notifier: (m: string, t?: 'ok' | 'err') => void; onChange: () => void }) {
  const [modules, setModules] = useState<Module[]>([])
  const [valides, setValides] = useState<Set<string>>(new Set())
  const [presences, setPresences] = useState<{ date: string; objectifs: string; statut: StatutPresence }[]>([])
  const [emailParent, setEmailParent] = useState('')

  useEffect(() => {
    if (!enfant.id) return
    Promise.all([
      enfant.coursId ? getModules(enfant.coursId) : Promise.resolve([]),
      getModulesValides(enfant.id),
      getPresencesEnfant(enfant.id),
    ]).then(([m, v, p]) => { setModules(m); setValides(new Set(v.map(x => x.moduleId))); setPresences(p) })
      .catch(() => {})
  }, [enfant])

  async function basculer(m: Module) {
    if (!enfant.id || !enfant.coursId || !m.id) return
    const valide = !valides.has(m.id)
    try {
      await basculerModuleValide(enfant.id, enfant.coursId, m.id, valide)
      setValides(s => { const n = new Set(s); if (valide) n.add(m.id!); else n.delete(m.id!); return n })
    } catch { notifier('Erreur', 'err') }
  }

  async function lier() {
    if (!enfant.id || !emailParent.trim()) return
    try { await lierCompteParent(enfant.id, emailParent); setEmailParent(''); notifier('Compte parent relié ✓'); onChange() }
    catch (e) { notifier(e instanceof Error ? e.message : 'Erreur', 'err') }
  }

  const presents = presences.filter(p => p.statut === 'present').length

  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>Compte du parent</h3>
      {enfant.parentProfileId ? (
        <p style={{ fontSize: 13, color: '#2e7d32', marginBottom: 16 }}>✓ Relié : le parent voit le suivi dans son Espace Membre.</p>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={emailParent} onChange={e => setEmailParent(e.target.value)} placeholder="Email du compte du parent" style={{ ...inp, padding: '8px 12px' }} />
          <button className="btn-primary" onClick={lier} disabled={!emailParent.trim()} style={{ whiteSpace: 'nowrap' }}>Relier</button>
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>
        Progression {modules.length > 0 && <Pastille texte={`${valides.size}/${modules.length} modules`} ton={valides.size === modules.length ? 'vert' : 'bleu'} />}
      </h3>
      {!enfant.coursId ? (
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>Aucun cours attribué (modifier la fiche).</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {modules.map(m => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={valides.has(m.id!)} onChange={() => basculer(m)} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
              {m.ordre}. {m.titre}
            </label>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>
        Présences {presences.length > 0 && <Pastille texte={`${presents}/${presences.length}`} ton="bleu" />}
      </h3>
      {presences.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Aucune présence enregistrée (Espace catéchiste → Présences).</p>
      ) : presences.slice(0, 8).map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
          <span>{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : ''} · {p.objectifs}</span>
          <span style={{ color: COULEURS[p.statut].fg, fontWeight: 700 }}>{STATUT_PRESENCE_LABELS[p.statut]}</span>
        </div>
      ))}
    </div>
  )
}
