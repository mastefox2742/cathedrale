'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getParcoursPublies, type Parcours } from '../../services/parcours'
import { PagePriere } from './PagePriere'

export function NeuvainesPage() {
  const [neuvaines, setNeuvaines] = useState<Parcours[]>([])

  useEffect(() => {
    getParcoursPublies(['neuvaine', 'retraite']).then(setNeuvaines).catch(() => setNeuvaines([]))
  }, [])

  return (
    <PagePriere eyebrow="En ligne" titre={<>Neuvaines <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>&amp; retraites</em></>}
      intro="Neuf jours de prière confiante, ou quelques jours pour se poser avec Dieu, à votre rythme.">
        <div className="inner">
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
    </PagePriere>
  )
}
