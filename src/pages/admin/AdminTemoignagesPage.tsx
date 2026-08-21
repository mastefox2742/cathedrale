import { useEffect, useMemo, useState } from 'react'
import {
  getAllTemoignages, updateStatutTemoignage, deleteTemoignage,
  STATUT_TEMOIGNAGE_LABELS, type Temoignage, type StatutTemoignage,
} from '../../services/temoignages'

const STATUT_COLORS: Record<StatutTemoignage, { bg: string; fg: string }> = {
  en_attente: { bg: 'rgba(21,101,192,.1)', fg: '#1565C0' },
  approuve: { bg: 'rgba(46,125,50,.12)', fg: '#2e7d32' },
  rejete: { bg: 'rgba(198,40,40,.1)', fg: '#c62828' },
}

export function AdminTemoignagesPage() {
  const [temoignages, setTemoignages] = useState<Temoignage[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<StatutTemoignage | 'toutes'>('en_attente')
  const [confirmDelete, setConfirmDelete] = useState<Temoignage | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try { setTemoignages(await getAllTemoignages()) }
    catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => temoignages.filter(t =>
    filterStatut === 'toutes' || t.statut === filterStatut
  ), [temoignages, filterStatut])

  async function handleStatutChange(t: Temoignage, statut: StatutTemoignage) {
    try {
      await updateStatutTemoignage(t.id!, statut)
      showToast(statut === 'approuve' ? 'Témoignage approuvé ✓' : statut === 'rejete' ? 'Témoignage rejeté' : 'Mis en attente')
      await load()
    } catch { showToast('Erreur', 'err') }
  }

  async function handleDelete(t: Temoignage) {
    try {
      await deleteTemoignage(t.id!)
      showToast('Témoignage supprimé')
      setConfirmDelete(null)
      await load()
    } catch { showToast('Erreur suppression', 'err') }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900, fontFamily: 'var(--font-sans)' }}>

      {toast && (
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
      )}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
          Témoignages
        </h1>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
          {temoignages.length} témoignage{temoignages.length > 1 ? 's' : ''} soumis
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as StatutTemoignage | 'toutes')} style={selectStyle}>
          <option value="toutes">Tous les statuts</option>
          {(Object.entries(STATUT_TEMOIGNAGE_LABELS) as [StatutTemoignage, string][]).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>rate_review</span>
          <p>Aucun témoignage pour ce filtre.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(t => {
            const c = STATUT_COLORS[t.statut]
            return (
              <div key={t.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>{t.auteurNom || 'Anonyme'}</p>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg, flexShrink: 0 }}>
                    {STATUT_TEMOIGNAGE_LABELS[t.statut]}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 14 }}>{t.contenu}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {t.statut !== 'approuve' && (
                    <button onClick={() => handleStatutChange(t, 'approuve')} style={actionBtn('#2e7d32', 'rgba(46,125,50,.1)')}>Approuver</button>
                  )}
                  {t.statut !== 'rejete' && (
                    <button onClick={() => handleStatutChange(t, 'rejete')} style={actionBtn('#c62828', 'rgba(198,40,40,.08)')}>Rejeter</button>
                  )}
                  {t.statut !== 'en_attente' && (
                    <button onClick={() => handleStatutChange(t, 'en_attente')} style={actionBtn('#1565C0', 'rgba(21,101,192,.08)')}>Remettre en attente</button>
                  )}
                  <button onClick={() => setConfirmDelete(t)} style={actionBtn('#c62828', '#ffebee')}>Supprimer</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer ce témoignage ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#c62828', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function actionBtn(color: string, bg: string): React.CSSProperties {
  return { padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: bg, color, fontSize: 12, fontWeight: 700 }
}

const selectStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1.5px solid var(--outline-variant)',
  borderRadius: 10, fontSize: 13, outline: 'none',
  fontFamily: 'var(--font-sans)', background: 'white', cursor: 'pointer',
}
