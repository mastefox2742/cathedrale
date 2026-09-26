'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getCharte, type Charte, type SlugCharte } from '../services/archidiocese'
import { Markdown } from '../components/Markdown'

const TITRES: Record<SlugCharte, string> = {
  media: 'Charte média',
  'protection-mineurs': 'Charte de protection des mineurs',
}

export function ChartePage() {
  const { slug } = useParams<{ slug: SlugCharte }>()
  const [charte, setCharte] = useState<Charte | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug || !(slug in TITRES)) { setLoading(false); return }
    getCharte(slug).then(setCharte).catch(() => setCharte(null)).finally(() => setLoading(false))
  }, [slug])

  const titre = slug && slug in TITRES ? TITRES[slug] : 'Charte'

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Standards de l&apos;archidiocèse</p>
          <h1><em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>{titre}</em></h1>
        </div>
      </div>
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        <div className="inner" style={{ maxWidth: 780 }}>
          {loading ? (
            <div className="page-loader"><div className="page-loader-ring" /></div>
          ) : !charte || !charte.publie ? (
            <p style={{ fontSize: 14, color: 'var(--text-light)' }}>Cette charte n&apos;est pas encore publiée.</p>
          ) : (
            <>
              <Markdown text={charte.contenu} />
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 28 }}>
                Version {charte.version} · {new Date(charte.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </>
          )}
          {slug === 'protection-mineurs' && (
            <Link href="/signaler" className="btn-gold" style={{ marginTop: 28 }}>Signaler une préoccupation</Link>
          )}
        </div>
      </section>
    </>
  )
}
