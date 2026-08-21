import { useEffect, useMemo, useState } from 'react'
import {
  getSignalements, updateSignalement,
  GRAVITE_LABELS, STATUT_SIGNALEMENT_LABELS,
  type Signalement, type StatutSignalement, type GraviteSignalement,
} from '../../services/signalements'
import { canViewSignalements } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'

const STATUT_COLORS: Record<StatutSignalement, { bg: string; fg: string }> = {
  nouveau: { bg: 'rgba(198,40,40,.1)', fg: '#c62828' },
  en_cours: { bg: 'rgba(255,160,0,.12)', fg: '#B26A00' },
  traite: { bg: 'rgba(46,125,50,.12)', fg: '#2e7d32' },
  archive: { bg: 'rgba(0,0,0,.06)', fg: 'var(--on-surface-variant)' },
}

export function AdminSignalementsPage() {
  const { profile } = useAuth()
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<StatutSignalement | 'tous'>('nouveau')
  const [selected, setSelected] = useState<Signalement | null>(null)
  const [notes, setNotes] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try { setSignalements(await getSignalements()) }
    catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (!canViewSignalements(profile?.role ?? null)) {
    return (
      <div style={{ padding: '32px 36px', fontFamily: 'var(--font-sans)' }}>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>lock</span>
          <p>Accès réservé à l'administrateur et au/à la responsable sécurité.</p>
        </div>
      </div>
    )
  }

  const filtered = useMemo(() => signalements.filter(s => filterStatut === 'tous' || s.statut === filterStatut), [signalements, filterStatut])

  function openDetail(s: Signalement) {
    setSelected(s)
    setNotes(s.notesSuivi ?? '')
  }

  async function handlePatch(s: Signalement, patch: Partial<Pick<Signalement, 'statut' | 'gravite'>>) {
    try {
      await updateSignalement(s.id!, patch)
      showToast('Mis à jour ✓')
      await load()
      setSelected(sel => sel && sel.id === s.id ? { ...sel, ...patch } : sel)
    } catch { showToast('Erreur', 'err') }
  }

  async function handleSaveNotes() {
    if (!selected?.id) return
    try {
      await updateSignalement(selected.id, { notesSuivi: notes })
      showToast('Notes enregistrées ✓')
      await load()
    } catch { showToast('Erreur', 'err') }
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
          Signalements
        </h1>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
          Confidentiel — visible uniquement par l'administrateur et le/la responsable sécurité.
        </p>
      </div>

      <div style={{
        background: 'rgba(198,40,40,.05)', border: '1px solid rgba(198,40,40,.15)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6,
      }}>
        Ces signalements peuvent être soumis anonymement, sans compte, via <strong>/signaler</strong>.
        Traitez chaque nouveau signalement rapidement et documentez les suites données. En cas de
        danger immédiat pour un enfant, agissez sans attendre une confirmation complète.
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as StatutSignalement | 'tous')} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          {(Object.entries(STATUT_SIGNALEMENT_LABELS) as [StatutSignalement, string][]).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>shield</span>
          <p>Aucun signalement pour ce filtre.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)', textAlign: 'left' }}>
                {['Concerne', 'Description', 'Gravité', 'Statut', 'Reçu le'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const c = STATUT_COLORS[s.statut]
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--outline-variant)', cursor: 'pointer' }} onClick={() => openDetail(s)}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>{s.concerne || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface-variant)', maxWidth: 320 }}>{s.description.slice(0, 90)}{s.description.length > 90 ? '…' : ''}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--on-surface-variant)' }}>{s.gravite ? GRAVITE_LABELS[s.gravite] : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg }}>
                        {STATUT_SIGNALEMENT_LABELS[s.statut]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)' }}>Signalement</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <FField label="Concerne">
              <p style={{ fontSize: 14, color: 'var(--on-surface)' }}>{selected.concerne || '— non précisé —'}</p>
            </FField>
            <FField label="Description">
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.description}</p>
            </FField>
            <FField label="Déclarant">
              <p style={{ fontSize: 14, color: 'var(--on-surface)' }}>
                {selected.reporterNom || 'Anonyme'}{selected.reporterContact ? ` · ${selected.reporterContact}` : ''}
              </p>
            </FField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FField label="Statut">
                <select value={selected.statut} onChange={e => handlePatch(selected, { statut: e.target.value as StatutSignalement })} style={inp}>
                  {(Object.entries(STATUT_SIGNALEMENT_LABELS) as [StatutSignalement, string][]).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </FField>
              <FField label="Gravité">
                <select value={selected.gravite ?? ''} onChange={e => handlePatch(selected, { gravite: (e.target.value || undefined) as GraviteSignalement | undefined })} style={inp}>
                  <option value="">— Non évaluée —</option>
                  {(Object.entries(GRAVITE_LABELS) as [GraviteSignalement, string][]).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </FField>
            </div>

            <FField label="Notes de suivi">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                placeholder="Actions entreprises, personnes contactées, suites données…" style={{ ...inp, resize: 'vertical' }} />
            </FField>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn-outline" onClick={() => setSelected(null)}>Fermer</button>
              <button className="btn-primary" onClick={handleSaveNotes}>Enregistrer les notes</button>
            </div>
          </div>
        </div>
      )}
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
