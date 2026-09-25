'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'

/**
 * Briques communes des pages d'administration (même rendu que les pages
 * existantes : toast vert/rouge, modale blanche arrondie, champs à bordure fine).
 */

export const inp: CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid var(--outline-variant)',
  borderRadius: 10, fontSize: 14, outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box', background: 'white',
}

export function FField({ label, children, aide }: { label: string; children: ReactNode; aide?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>{label}</label>
      {children}
      {aide && <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4 }}>{aide}</p>}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  function show(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }
  const node = toast && (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '12px 20px', borderRadius: 12,
      background: toast.type === 'ok' ? '#1b5e20' : '#b71c1c',
      color: 'white', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
        {toast.type === 'ok' ? 'check_circle' : 'error'}
      </span>
      {toast.msg}
    </div>
  )
  return { show, node }
}

export function PageAdmin({ titre, sousTitre, action, children, maxWidth = 1100 }: {
  titre: string; sousTitre?: ReactNode; action?: ReactNode; children: ReactNode; maxWidth?: number
}) {
  return (
    <div style={{ padding: '32px 36px', maxWidth, fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>{titre}</h1>
          {sousTitre && <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>{sousTitre}</p>}
        </div>
        {action}
      </div>
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function Chargement() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
      Chargement…
    </div>
  )
}

export function Vide({ icone, texte }: { icone: string; texte: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{icone}</span>
      <p>{texte}</p>
    </div>
  )
}

export function Modale({ titre, onClose, children, maxWidth = 560 }: { titre: string; onClose: () => void; children: ReactNode; maxWidth?: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" style={{
        background: 'white', borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 24 }}>{titre}</h2>
        {children}
      </div>
    </div>
  )
}

export function BoutonsModale({ onAnnuler, onValider, enCours, libelle }: { onAnnuler: () => void; onValider: () => void; enCours?: boolean; libelle: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
      <button className="btn-outline" onClick={onAnnuler}>Annuler</button>
      <button className="btn-primary" onClick={onValider} disabled={enCours} style={{ gap: 8, opacity: enCours ? 0.7 : 1 }}>
        {enCours && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>}
        {enCours ? 'Enregistrement…' : libelle}
      </button>
    </div>
  )
}

export function ConfirmationSuppression({ texte, onAnnuler, onConfirmer }: { texte: string; onAnnuler: () => void; onConfirmer: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div role="alertdialog" aria-modal="true" style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Confirmer la suppression</h3>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>{texte}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onAnnuler}>Annuler</button>
          <button onClick={onConfirmer} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#c62828', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export function IconBtn({ icone, titre, onClick, ton = 'neutre', actif }: {
  icone: string; titre: string; onClick: () => void; ton?: 'neutre' | 'primaire' | 'danger' | 'succes'; actif?: boolean
}) {
  const couleurs = {
    neutre: { bg: 'var(--surface-container)', fg: 'var(--on-surface-variant)' },
    primaire: { bg: 'rgba(0,35,111,0.06)', fg: 'var(--primary)' },
    danger: { bg: '#ffebee', fg: '#c62828' },
    succes: { bg: '#e8f5e9', fg: '#2e7d32' },
  }[ton]
  return (
    <button onClick={onClick} title={titre} aria-label={titre}
      style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: couleurs.bg, color: couleurs.fg, flexShrink: 0 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: actif ? "'FILL' 1" : undefined }}>{icone}</span>
    </button>
  )
}

export function Pastille({ texte, ton = 'bleu' }: { texte: string; ton?: 'bleu' | 'gris' | 'vert' | 'orange' | 'rouge' }) {
  const c = {
    bleu: ['rgba(0,35,111,0.08)', 'var(--primary)'],
    gris: ['rgba(0,0,0,0.06)', 'var(--on-surface-variant)'],
    vert: ['rgba(46,125,50,.12)', '#2e7d32'],
    orange: ['rgba(245,127,23,.12)', '#e65100'],
    rouge: ['rgba(198,40,40,.1)', '#c62828'],
  }[ton]
  return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c[0], color: c[1], whiteSpace: 'nowrap' }}>{texte}</span>
}

export const thStyle: CSSProperties = { padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', textAlign: 'left' }
export const tdStyle: CSSProperties = { padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)', borderTop: '1px solid var(--outline-variant)' }
