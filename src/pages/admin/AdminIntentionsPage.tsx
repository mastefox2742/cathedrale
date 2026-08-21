import { useEffect, useMemo, useState } from 'react'
import {
  getIntentionsAdmin, updateIntention, deleteIntention,
  STATUT_INTENTION_LABELS, type PrayerIntentionAdmin, type StatutIntention,
} from '../../services/prieres'
import { getStaffProfiles, type UserProfile } from '../../services/auth'

const STATUT_COLORS: Record<StatutIntention, { bg: string; fg: string }> = {
  recue: { bg: 'rgba(21,101,192,.1)', fg: '#1565C0' },
  en_cours: { bg: 'rgba(255,160,0,.12)', fg: '#B26A00' },
  traitee: { bg: 'rgba(46,125,50,.12)', fg: '#2e7d32' },
  archivee: { bg: 'rgba(0,0,0,.06)', fg: 'var(--on-surface-variant)' },
}

function tronquer(texte: string, max = 60) {
  return texte.length > max ? texte.slice(0, max) + '…' : texte
}

export function AdminIntentionsPage() {
  const [intentions, setIntentions] = useState<PrayerIntentionAdmin[]>([])
  const [staff, setStaff] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PrayerIntentionAdmin | null>(null)
  const [notes, setNotes] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<PrayerIntentionAdmin | null>(null)
  const [filterStatut, setFilterStatut] = useState<StatutIntention | 'toutes'>('toutes')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const [i, s] = await Promise.all([getIntentionsAdmin(), getStaffProfiles()])
      setIntentions(i); setStaff(s)
    } catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => intentions.filter(i =>
    filterStatut === 'toutes' || i.statut === filterStatut
  ), [intentions, filterStatut])

  function openDetail(i: PrayerIntentionAdmin) {
    setSelected(i); setNotes(i.notesInternes || '')
  }

  async function handleStatutChange(i: PrayerIntentionAdmin, statut: StatutIntention) {
    try {
      await updateIntention(i.id, { statut })
      showToast('Statut mis à jour ✓')
      await load()
      setSelected(sel => sel && sel.id === i.id ? { ...sel, statut } : sel)
    } catch { showToast('Erreur', 'err') }
  }

  async function handleAssignChange(i: PrayerIntentionAdmin, assigneA: string) {
    try {
      await updateIntention(i.id, { assigneA })
      showToast('Assignation mise à jour ✓')
      await load()
      setSelected(sel => sel && sel.id === i.id ? { ...sel, assigneA } : sel)
    } catch { showToast('Erreur', 'err') }
  }

  async function handleSaveNotes() {
    if (!selected) return
    try {
      await updateIntention(selected.id, { notesInternes: notes })
      showToast('Notes enregistrées ✓')
      await load()
    } catch { showToast('Erreur', 'err') }
  }

  async function handleDelete(i: PrayerIntentionAdmin) {
    try {
      await deleteIntention(i.id)
      showToast('Intention supprimée')
      setConfirmDelete(null)
      if (selected?.id === i.id) setSelected(null)
      await load()
    } catch { showToast('Erreur suppression', 'err') }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'var(--font-sans)' }}>

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

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
          Intentions de prière
        </h1>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
          {intentions.length} intention{intentions.length > 1 ? 's' : ''} déposée{intentions.length > 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as StatutIntention | 'toutes')} style={selectStyle}>
          <option value="toutes">Tous les statuts</option>
          {(Object.entries(STATUT_INTENTION_LABELS) as [StatutIntention, string][]).map(([k, l]) => (
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
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>inbox</span>
          <p>Aucune intention pour ce filtre.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)', textAlign: 'left' }}>
                {['Intention', 'Auteur', 'Visibilité', 'Statut', 'Assigné à', 'Reçue le', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const c = STATUT_COLORS[i.statut]
                const assignee = staff.find(s => s.uid === i.assigneA)
                return (
                  <tr key={i.id} style={{ borderTop: '1px solid var(--outline-variant)', cursor: 'pointer' }} onClick={() => openDetail(i)}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)', fontStyle: 'italic' }}>{tronquer(i.contenu)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface-variant)' }}>
                      {i.estAnonyme ? 'Anonyme' : (i.auteurNom || i.auteurEmail || '—')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--on-surface-variant)' }}>{i.is_public ? 'Mur public' : 'Privée'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg }}>
                        {STATUT_INTENTION_LABELS[i.statut]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface-variant)' }}>{assignee?.nom || assignee?.email || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {new Date(i.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(i) }}
                        style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffebee', color: '#c62828' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 4 }}>
                  Intention de prière
                </h2>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  {selected.is_public ? 'Visible sur le mur public' : 'Intention privée'}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <FField label="Auteur">
              <p style={{ fontSize: 14, color: 'var(--on-surface)' }}>
                {selected.estAnonyme ? 'Anonyme (souhait exprimé par l\'auteur)' : (selected.auteurNom || selected.auteurEmail || 'Membre')}
              </p>
            </FField>
            <FField label="Contenu">
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{selected.contenu}</p>
            </FField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FField label="Statut">
                <select value={selected.statut} onChange={e => handleStatutChange(selected, e.target.value as StatutIntention)} style={inp}>
                  {(Object.entries(STATUT_INTENTION_LABELS) as [StatutIntention, string][]).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </FField>
              <FField label="Assigné à">
                <select value={selected.assigneA || ''} onChange={e => handleAssignChange(selected, e.target.value)} style={inp}>
                  <option value="">— Non assigné —</option>
                  {staff.map(s => <option key={s.uid} value={s.uid}>{s.nom || s.email}</option>)}
                </select>
              </FField>
            </div>

            <FField label="Notes internes">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Notes visibles par le staff uniquement…" style={{ ...inp, resize: 'vertical' }} />
            </FField>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn-outline" onClick={() => setSelected(null)}>Fermer</button>
              <button className="btn-primary" onClick={handleSaveNotes}>Enregistrer les notes</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer cette intention ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>« {tronquer(confirmDelete.contenu, 80)} » sera définitivement supprimée.</p>
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

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid var(--outline-variant)',
  borderRadius: 10, fontSize: 14, outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box', background: 'white',
}

const selectStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1.5px solid var(--outline-variant)',
  borderRadius: 10, fontSize: 13, outline: 'none',
  fontFamily: 'var(--font-sans)', background: 'white', cursor: 'pointer',
}
