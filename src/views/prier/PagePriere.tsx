'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/** Gabarit des pages dédiées de la rubrique « Prier » : en-tête + retour vers le sommaire. */
export function PagePriere({ eyebrow, titre, intro, children }: { eyebrow: string; titre: ReactNode; intro?: string; children: ReactNode }) {
  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <Link href="/prier" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.75)', textDecoration: 'none', marginBottom: 14 }}>
            <ArrowLeft size={14} /> Prier
          </Link>
          <p className="page-hero-eyebrow">{eyebrow}</p>
          <h1>{titre}</h1>
          {intro && <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', marginTop: 12, maxWidth: 560, lineHeight: 1.7 }}>{intro}</p>}
        </div>
      </div>
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        {children}
      </section>
    </>
  )
}
