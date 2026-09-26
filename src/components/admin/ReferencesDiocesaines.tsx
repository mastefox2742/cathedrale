'use client'

import { useEffect, useState } from 'react'

export interface ElementReference { id: string; titre: string; emoji: string; detail?: string }

/**
 * Programmes « modèles » de l'archidiocèse, affichés dans le périmètre d'une
 * paroisse : la paroisse les copie pour les adapter (brouillon modifiable).
 */
export function ReferencesDiocesaines({ titre, charger, dupliquer, notifier }: {
  titre: string
  charger: () => Promise<ElementReference[]>
  dupliquer: (id: string) => Promise<unknown>
  notifier: (m: string, t?: 'ok' | 'err') => void
}) {
  const [elements, setElements] = useState<ElementReference[]>([])
  const [enCours, setEnCours] = useState<string | null>(null)

  useEffect(() => {
    charger().then(setElements).catch(() => setElements([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (elements.length === 0) return null

  async function copier(e: ElementReference) {
    setEnCours(e.id)
    try { await dupliquer(e.id); notifier(`« ${e.titre} » copié dans votre paroisse (brouillon) ✓`) }
    catch { notifier('Erreur lors de la copie', 'err') }
    finally { setEnCours(null) }
  }

  return (
    <div style={{ marginBottom: 28, padding: 16, borderRadius: 14, background: 'rgba(0,35,111,0.04)', border: '1px dashed rgba(0,35,111,0.2)' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{titre}</p>
      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 12 }}>
        Programmes de référence de l&apos;archidiocèse : copiez-les dans votre paroisse pour les adapter.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {elements.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px 6px 12px', borderRadius: 20, background: 'white', border: '1px solid var(--outline-variant)' }}>
            <span style={{ fontSize: 13 }}>{e.emoji} {e.titre}{e.detail ? <span style={{ color: 'var(--on-surface-variant)' }}> · {e.detail}</span> : null}</span>
            <button onClick={() => copier(e)} disabled={enCours === e.id}
              style={{ padding: '4px 10px', borderRadius: 14, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: enCours === e.id ? .6 : 1 }}>
              {enCours === e.id ? 'Copie…' : 'Copier'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
