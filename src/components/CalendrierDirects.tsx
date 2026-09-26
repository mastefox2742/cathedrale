'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Direct } from '../services/mediation'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/** Calendrier mensuel des directs programmés. */
export function CalendrierDirects({ directs }: { directs: Direct[] }) {
  const [mois, setMois] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selection, setSelection] = useState<string | null>(null)

  const cle = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const parJour = new Map<string, Direct[]>()
  for (const d of directs) {
    const k = cle(new Date(d.debut))
    parJour.set(k, [...(parJour.get(k) ?? []), d])
  }

  // Semaine commençant le lundi.
  const decalage = (mois.getDay() + 6) % 7
  const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate()
  const cases: (Date | null)[] = [
    ...Array.from({ length: decalage }, () => null),
    ...Array.from({ length: nbJours }, (_, i) => new Date(mois.getFullYear(), mois.getMonth(), i + 1)),
  ]
  const aujourdhui = cle(new Date())
  const duJour = selection ? parJour.get(selection) ?? [] : []

  const bouton = { background: 'none', border: '1px solid var(--border-accent)', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' } as const

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button style={bouton} aria-label="Mois précédent" onClick={() => setMois(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
        <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
          {mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </span>
        <button style={bouton} aria-label="Mois suivant" onClick={() => setMois(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
      </div>
      <div role="grid" aria-label="Calendrier des directs" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {JOURS.map(j => <div key={j} role="columnheader" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-light)', textAlign: 'center', padding: '6px 0' }}>{j}</div>)}
        {cases.map((d, i) => {
          if (!d) return <div key={`v${i}`} />
          const k = cle(d)
          const n = parJour.get(k)?.length ?? 0
          const actif = selection === k
          return (
            <button key={k} role="gridcell" onClick={() => setSelection(n ? k : null)} aria-label={`${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}${n ? ` : ${n} direct${n > 1 ? 's' : ''}` : ''}`}
              style={{
                aspectRatio: '1', border: `1px solid ${actif ? 'var(--primary)' : 'var(--border)'}`, cursor: n ? 'pointer' : 'default',
                background: actif ? 'var(--primary)' : n ? 'var(--bg-alt)' : 'var(--surface)',
                color: actif ? '#fff' : k === aujourdhui ? 'var(--accent-dark)' : 'var(--text)',
                fontWeight: k === aujourdhui ? 700 : 400, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              }}>
              {d.getDate()}
              {n > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: actif ? '#fff' : 'var(--gold)' }} />}
            </button>
          )
        })}
      </div>
      {duJour.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {duJour.map(d => (
            <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none' }}>
              <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 15, color: 'var(--text)' }}>{d.titre}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-dark)' }}>{new Date(d.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
