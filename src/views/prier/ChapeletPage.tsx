'use client'

import { PagePriere } from './PagePriere'
import { mysteresDuJour, ETAPES_CHAPELET } from '../../lib/priere'

export function ChapeletPage() {
  const mysteres = mysteresDuJour(new Date().getDay())
  return (
    <PagePriere eyebrow="Le chapelet du jour" titre={<>Prier <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>le chapelet</em></>}
      intro="Méditer la vie du Christ avec Marie, en suivant les mystères proposés pour ce jour.">
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
    </PagePriere>
  )
}
