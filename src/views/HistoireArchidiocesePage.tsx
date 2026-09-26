'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getArchidiocese, type Archidiocese } from '../services/archidiocese'
import { Markdown } from '../components/Markdown'

export function HistoireArchidiocesePage() {
  const [archidiocese, setArchidiocese] = useState<Archidiocese | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArchidiocese().then(setArchidiocese).catch(() => setArchidiocese(null)).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Notre identité</p>
          <h1>Histoire de <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>l&apos;archidiocèse</em></h1>
        </div>
      </div>

      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        <div className="inner" style={{ maxWidth: 780 }}>
          {loading ? (
            <div className="page-loader"><div className="page-loader-ring" /></div>
          ) : !archidiocese?.histoire ? (
            <p style={{ fontSize: 14, color: 'var(--text-light)' }}>L&apos;histoire de l&apos;archidiocèse sera publiée prochainement.</p>
          ) : (
            <>
              {archidiocese.presentation && (
                <p className="reveal" style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 19, fontStyle: 'italic', color: 'var(--primary)', lineHeight: 1.7, marginBottom: 32 }}>
                  {archidiocese.presentation}
                </p>
              )}
              <div className="reveal"><Markdown text={archidiocese.histoire} /></div>
              {archidiocese.histoireMaj && (
                <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 28 }}>
                  Mis à jour le {new Date(archidiocese.histoireMaj).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 36 }}>
            <Link href="/histoire" className="btn-gold">Histoire de la Cathédrale</Link>
            <Link href="/paroisses" className="btn-outline">Les paroisses</Link>
          </div>
        </div>
      </section>
    </>
  )
}
