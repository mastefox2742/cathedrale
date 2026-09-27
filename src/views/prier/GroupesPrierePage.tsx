'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroupes, type Groupe } from '../../services/groupes'
import { AdhesionModal } from '../../components/AdhesionModal'
import { PagePriere } from './PagePriere'

export function GroupesPrierePage() {
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [adhesion, setAdhesion] = useState<Groupe | null>(null)

  useEffect(() => {
    getGroupes().then(g => setGroupes(g.filter(x => ['priere', 'biblique', 'liturgie'].includes(x.categorie)))).catch(() => setGroupes([]))
  }, [])

  return (
    <PagePriere eyebrow="Prier ensemble" titre={<>Groupes <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>de prière</em></>}
      intro="Prière, partage biblique, liturgie : rejoignez un groupe près de chez vous.">
        <div className="inner">
          {groupes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Les groupes de prière seront bientôt annoncés ici. <Link href="/vie-spirituelle" style={{ color: 'var(--blue)' }}>Voir tous les groupes</Link></p>
          ) : (
            <div className="grid-3">
              {groupes.map(g => (
                <div key={g.id} className="dark-card reveal" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{g.icon}</span>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{g.titre}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, flex: 1 }}>{g.description}</p>
                  {g.horaire && <p style={{ fontSize: 11, color: 'var(--accent-dark)', fontWeight: 700 }}>{g.horaire}</p>}
                  <button onClick={() => setAdhesion(g)} className="btn-outline" style={{ fontSize: 10, alignSelf: 'flex-start' }}>Rejoindre ce groupe</button>
                </div>
              ))}
            </div>
          )}
        </div>
      {adhesion && <AdhesionModal groupe={adhesion} onClose={() => setAdhesion(null)} />}
    </PagePriere>
  )
}
