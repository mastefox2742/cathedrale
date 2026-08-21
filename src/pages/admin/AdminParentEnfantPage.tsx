import { useEffect, useMemo, useState } from 'react'
import {
  getDemandes, updateDemande, deleteDemande,
  STATUT_DEMANDE_LABELS,
  type DemandePastorale, type StatutDemande,
} from '../../services/demandesPastorales'
import { getStaffProfiles, type UserProfile } from '../../services/auth'

const STATUT_COLORS: Record<StatutDemande, { bg: string; fg: string }> = {
  recue: { bg: 'rgba(21,101,192,.1)', fg: '#1565C0' },
  en_cours: { bg: 'rgba(255,160,0,.12)', fg: '#B26A00' },
  traitee: { bg: 'rgba(46,125,50,.12)', fg: '#2e7d32' },
  archivee: { bg: 'rgba(0,0,0,.06)', fg: 'var(--on-surface-variant)' },
}

export function AdminParentEnfantPage() {
  const [demandes, setDemandes] = useState<DemandePastorale[]>([])
  const [staff, setStaff] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DemandePastorale | null>(null)
  const [notes, setNotes] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<DemandePastorale | null>(null)
  const [filterStatut, setFilterStatut] = useState<StatutDemande | 'toutes'>('toutes')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const [d, s] = await Promise.all([getDemandes(), getStaffProfiles()])
      setDemandes(d.filter(x => x.type === 'catechisme')); setStaff(s)
    } catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => demandes.filter(d =>
    filterStatut === 'toutes' || d.statut === filterStatut
  ), [demandes, filterStatut])

  function openDetail(d: DemandePastorale) {
    setSelected(d); setNotes(d.notesInternes || '')
  }

  async function handleStatutChange(d: DemandePastorale, statut: StatutDemande) {
    try {
      await updateDemande(d.id!, { statut })
      showToast('Statut mis à jour ✓')
      await load()
      setSelected(sel => sel && sel.id === d.id ? { ...sel, statut } : sel)
    } catch { showToast('Erreur', 'err') }
  }

  async function handleAssignChange(d: DemandePastorale, assigneA: string) {
    try {
      await updateDemande(d.id!, { assigneA })
      showToast('Assignation mise à jour ✓')
      await load()
      setSelected(sel => sel && sel.id === d.id ? { ...sel, assigneA } : sel)
    } catch { showToast('Erreur', 'err') }
  }

  async function handleSaveNotes() {
    if (!selected?.id) return
    try {
      await updateDemande(selected.id, { notesInternes: notes })
      showToast('Notes enregistrées ✓')
      await load()
    } catch { showToast('Erreur', 'err') }
  }

  async function handleDelete(d: DemandePastorale) {
    try {
      await deleteDemande(d.id!)
      showToast('Demande supprimée')
      setConfirmDelete(null)
      if (selected?.id === d.id) setSelected(null)
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

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
          Suivi Parent-Enfant
        </h1>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
          {demandes.length} inscription{demandes.length > 1 ? 's' : ''} au catéchisme soumise{demandes.length > 1 ? 's' : ''} par un parent
        </p>
      </div>

      <div style={{
        background: 'rgba(21,101,192,.06)', border: '1px solid rgba(21,101,192,.15)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6,
      }}>
        Ces demandes sont soumises par les parents via <strong>Démarches pastorales</strong>
        (« Inscription au catéchisme »). Il ne s'agit que d'une file de traitement de demandes,
        pas d'un dossier ou d'un compte enfant : aucune fiche individuelle n'est créée ni suivie
        dans la durée — chaque demande est traitée puis peut être archivée ou supprimée.
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as StatutDemande | 'toutes')} style={selectStyle}>
          <option value="toutes">Tous les statuts</option>
          {(Object.entries(STATUT_DEMANDE_LABELS) as [StatutDemande, string][]).map(([k, l]) => (
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
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>family_restroom</span>
          <p>Aucune inscription au catéchisme pour ce filtre.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)', textAlign: 'left' }}>
                {['Référence', 'Parent', 'Contact', 'Statut', 'Assigné à', 'Reçue le', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const c = STATUT_COLORS[d.statut]
                const assignee = staff.find(s => s.uid === d.assigneA)
                return (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--outline-variant)', cursor: 'pointer' }} onClick={() => openDetail(d)}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', color: 'var(--on-surface)' }}>{d.reference}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>{d.nom}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface-variant)' }}>{d.contact}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg }}>
                        {STATUT_DEMANDE_LABELS[d.statut]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface-variant)' }}>{assignee?.nom || assignee?.email || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(d) }}
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
                  Inscription au catéchisme
                </h2>
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--on-surface-variant)' }}>{selected.reference}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <FField label="Parent / demandeur">
              <p style={{ fontSize: 14, color: 'var(--on-surface)' }}>{selected.nom}</p>
            </FField>
            <FField label="Contact">
              <p style={{ fontSize: 14, color: 'var(--on-surface)' }}>{selected.contact}</p>
            </FField>
            <FField label="Message (détails de l'inscription)">
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
            </FField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FField label="Statut">
                <select value={selected.statut} onChange={e => handleStatutChange(selected, e.target.value as StatutDemande)} style={inp}>
                  {(Object.entries(STATUT_DEMANDE_LABELS) as [StatutDemande, string][]).map(([k, l]) => (
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
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer cette demande ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>La demande « {confirmDelete.reference} » sera définitivement supprimée.</p>
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
