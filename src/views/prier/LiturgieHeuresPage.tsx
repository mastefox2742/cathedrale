'use client'

import { useEffect, useState } from 'react'
import { PagePriere } from './PagePriere'
import { OFFICES, chargerOffice, officeDuMoment, type OfficeKey, type PartieOffice } from '../../lib/priere'

export function LiturgieHeuresPage() {
  const [office, setOffice] = useState<OfficeKey>(officeDuMoment())
  const [parties, setParties] = useState<PartieOffice[]>([])
  const [officeEtat, setOfficeEtat] = useState<'chargement' | 'ok' | 'erreur'>('chargement')

  useEffect(() => {
    setOfficeEtat('chargement')
    chargerOffice(office).then(p => { setParties(p); setOfficeEtat('ok') }).catch(() => setOfficeEtat('erreur'))
  }, [office])

  return (
    <PagePriere eyebrow="Prière de l'Église" titre={<>Liturgie <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>des heures</em></>}
      intro="Laudes, milieu du jour, vêpres et complies : prier avec toute l'Église, aux heures du jour.">
        <div className="inner" style={{ maxWidth: 820 }}>
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
      <style>{`
        .office-texte h5 { font-size: 13px; color: var(--accent-dark); margin: 12px 0 4px; }
        .office-texte p { margin-bottom: 10px; }
        .office-texte sup { font-size: 10px; color: var(--text-light); margin-right: 3px; }
        .office-texte u { text-decoration: none; font-weight: 700; }
      `}</style>
    </PagePriere>
  )
}
