import { useState } from 'react'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface AttestationProps {
  /** Ex. « Cathédrale Sacré-Cœur de Brazzaville ». */
  emetteur: string
  /** Ex. « a suivi avec succès le parcours de catéchisme ». */
  intitule: string
  titre: string
  completedAt: string
  signataire?: string
}

/** Attestation imprimable (catéchèse, parcours de foi, formations du staff). */
export function Attestation({ emetteur, intitule, titre, completedAt, signataire = 'Le catéchiste' }: AttestationProps) {
  const [nom, setNom] = useState('')

  return (
    <div style={{ minHeight: '100vh', background: '#e9edf2', padding: '40px 20px', fontFamily: 'var(--v2-font-sans)' }}>
      <div className="no-print" style={{ maxWidth: 640, margin: '0 auto 24px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <input
          value={nom} onChange={e => setNom(e.target.value)}
          placeholder="Votre nom à afficher sur l'attestation"
          style={{ flex: 1, minWidth: 240, padding: '11px 14px', borderRadius: 8, border: '1.5px solid #c8d0da', fontSize: 14, outline: 'none' }}
        />
        <button onClick={() => window.print()} className="btn-gold" disabled={!nom.trim()} style={{ opacity: nom.trim() ? 1 : 0.5, cursor: nom.trim() ? 'pointer' : 'not-allowed' }}>
          🖨️ Imprimer / Enregistrer en PDF
        </button>
      </div>

      <div id="certificate" style={{
        maxWidth: 780, margin: '0 auto', background: '#fdfbf6',
        border: '10px solid var(--primary, #1E3A5F)', outline: '2px solid #C1A461', outlineOffset: -18,
        padding: '64px 56px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.15)',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase', color: '#8A7A58', marginBottom: 6 }}>
          {emetteur}
        </p>
        <p style={{ fontSize: 12, color: '#718096', marginBottom: 34 }}>Archidiocèse de Brazzaville</p>

        <h1 style={{ fontFamily: 'var(--v2-font-serif, Georgia, serif)', fontSize: 34, color: '#1E3A5F', marginBottom: 6 }}>
          Attestation de réussite
        </h1>
        <div style={{ width: 60, height: 3, background: '#C1A461', margin: '0 auto 34px' }} />

        <p style={{ fontSize: 14, color: '#4A5568', marginBottom: 6 }}>Ceci certifie que</p>
        <p style={{ fontFamily: 'var(--v2-font-serif, Georgia, serif)', fontSize: 28, color: '#1E3A5F', fontStyle: 'italic', marginBottom: 20, minHeight: 40 }}>
          {nom.trim() || '…'}
        </p>
        <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 30px' }}>
          {intitule}
          <br />
          <strong style={{ color: '#1E3A5F', fontSize: 17 }}>{titre}</strong>
        </p>

        <p style={{ fontSize: 13, color: '#718096', marginBottom: 44 }}>
          Achevé le {formatDate(completedAt)}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 160, borderTop: '1px solid #C1A461', marginBottom: 6 }} />
            <p style={{ fontSize: 11, color: '#718096' }}>{signataire}</p>
          </div>
          <div style={{ fontSize: 32 }}>✝️</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 160, borderTop: '1px solid #C1A461', marginBottom: 6 }} />
            <p style={{ fontSize: 11, color: '#718096' }}>Le curé</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #certificate { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  )
}
