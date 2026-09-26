'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { getAlertes, marquerAlertesLues, ICONE_ALERTE, type Alerte } from '../../services/archidiocese'
import { ARCHIDIOCESE } from '../../services/scope'

/**
 * Alertes aux responsables : chaque nouvelle démarche, intention, adhésion,
 * témoignage, don ou signalement crée une alerte (trigger SQL), visible
 * uniquement par les personnes qui ont le droit de la traiter.
 */
export function ClocheAlertes({ userId, perimetre }: { userId: string; perimetre: string | null }) {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [ouvert, setOuvert] = useState(false)

  const charger = useCallback(() => {
    getAlertes(userId, perimetre && perimetre !== ARCHIDIOCESE ? perimetre : null).then(setAlertes).catch(() => setAlertes([]))
  }, [userId, perimetre])

  useEffect(() => {
    charger()
    const t = setInterval(charger, 60_000) // nouvelles alertes toutes les minutes
    return () => clearInterval(t)
  }, [charger])

  const nonLues = alertes.filter(a => !a.lue)

  async function toutMarquerLu() {
    await marquerAlertesLues(userId, nonLues.map(a => a.id)).catch(() => {})
    setAlertes(l => l.map(a => ({ ...a, lue: true })))
  }

  return (
    <div style={{ position: 'relative', padding: '0 12px' }}>
      <button onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} aria-label={`Alertes : ${nonLues.length} non lue${nonLues.length > 1 ? 's' : ''}`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: nonLues.length ? 'rgba(254,214,91,0.18)' : 'rgba(255,255,255,0.08)', color: 'white', fontSize: 14, fontFamily: 'var(--font-sans)',
        }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
        <span style={{ flex: 1, textAlign: 'left' }}>Alertes</span>
        {nonLues.length > 0 && (
          <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: 'var(--secondary-container)', color: 'var(--primary)', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
            {nonLues.length > 99 ? '99+' : nonLues.length}
          </span>
        )}
      </button>

      {ouvert && (
        <div role="dialog" aria-label="Alertes" style={{
          position: 'absolute', left: 12, right: -260, top: 44, zIndex: 50, background: 'white', borderRadius: 14,
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)', maxHeight: 420, overflowY: 'auto', color: 'var(--on-surface)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--outline-variant)' }}>
            <strong style={{ fontSize: 14 }}>Alertes</strong>
            {nonLues.length > 0 && <button onClick={toutMarquerLu} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Tout marquer comme lu</button>}
          </div>
          {alertes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', padding: 16 }}>Aucune alerte.</p>
          ) : alertes.map(a => (
            <Link key={a.id} href={a.lien} onClick={() => { marquerAlertesLues(userId, [a.id]).catch(() => {}); setAlertes(l => l.map(x => x.id === a.id ? { ...x, lue: true } : x)); setOuvert(false) }}
              style={{ display: 'flex', gap: 10, padding: '10px 14px', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--outline-variant)', background: a.lue ? 'white' : 'rgba(0,35,111,0.04)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: a.type === 'signalement' ? '#c62828' : 'var(--primary)' }}>{ICONE_ALERTE[a.type]}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: a.lue ? 400 : 700 }}>{a.titre}</span>
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{new Date(a.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
