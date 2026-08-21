import { useEffect, useMemo, useState } from 'react'
import {
  getSeances, createSeance, updateSeance, deleteSeance,
  STATUT_SEANCE_LABELS, type SeanceCatechisme, type StatutSeance,
} from '../../services/seancesCatechisme'
import { getAllCours, type Cours } from '../../services/catechisme'

const STATUT_COLORS: Record<StatutSeance, { bg: string; fg: string }> = {
  planifiee: { bg: 'rgba(21,101,192,.1)', fg: '#1565C0' },
  faite: { bg: 'rgba(46,125,50,.12)', fg: '#2e7d32' },
  annulee: { bg: 'rgba(0,0,0,.06)', fg: 'var(--on-surface-variant)' },
}

const EMPTY = { coursId: '', date: new Date().toISOString().slice(0, 10), objectifs: '', notesPreparation: '' }

export function AdminEspaceCatechistePage() {
  const [seances, setSeances] = useState<SeanceCatechisme[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SeanceCatechisme | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<SeanceCatechisme | null>(null)
  const [filterStatut, setFilterStatut] = useState<StatutSeance | 'toutes'>('toutes')
  const [filterCours, setFilterCours] = useState<string | 'tous'>('tous')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([getSeances(), getAllCours()])
      setSeances(s); setCours(c)
    } catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => seances.filter(s =>
    (filterStatut === 'toutes' || s.statut === filterStatut) &&
    (filterCours === 'tous' || s.coursId === filterCours)
  ), [seances, filterStatut, filterCours])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY, coursId: cours[0]?.id || '' })
    setShowForm(true)
  }

  function openEdit(s: SeanceCatechisme) {
    setEditing(s)
    setForm({ coursId: s.coursId, date: s.date, objectifs: s.objectifs, notesPreparation: s.notesPreparation || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.coursId) return showToast('Choisissez un cours', 'err')
    if (!form.objectifs.trim()) return showToast('Les objectifs sont obligatoires', 'err')
    setSaving(true)
    try {
      if (editing?.id) {
        await updateSeance(editing.id, form)
        showToast('Séance mise à jour ✓')
      } else {
        await createSeance(form)
        showToast('Séance créée ✓')
      }
      setShowForm(false)
      await load()
    } catch { showToast('Erreur sauvegarde', 'err') }
    finally { setSaving(false) }
  }

  async function handleStatutChange(s: SeanceCatechisme, statut: StatutSeance) {
    try {
      await updateSeance(s.id!, { statut })
      showToast('Statut mis à jour ✓')
      await load()
    } catch { showToast('Erreur', 'err') }
  }

  async function handleDelete(s: SeanceCatechisme) {
    try {
      await deleteSeance(s.id!)
      showToast('Séance supprimée')
      setConfirmDelete(null)
      await load()
    } catch { showToast('Erreur suppression', 'err') }
  }

  const coursLabel = (id: string) => cours.find(c => c.id === id)?.titre ?? '—'

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

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
            Espace catéchiste
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {seances.length} séance{seances.length > 1 ? 's' : ''} · Préparation des séances de catéchisme
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} disabled={cours.length === 0} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouvelle séance
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as StatutSeance | 'toutes')} style={selectStyle}>
          <option value="toutes">Tous les statuts</option>
          {(Object.entries(STATUT_SEANCE_LABELS) as [StatutSeance, string][]).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <select value={filterCours} onChange={e => setFilterCours(e.target.value)} style={selectStyle}>
          <option value="tous">Tous les cours</option>
          {cours.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : cours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>school</span>
          <p>Créez d'abord un cours de catéchisme pour pouvoir planifier des séances.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>edit_calendar</span>
          <p>Aucune séance pour ce filtre.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)', textAlign: 'left' }}>
                {['Date', 'Cours', 'Objectifs', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const c = STATUT_COLORS[s.statut]
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--outline-variant)', cursor: 'pointer' }} onClick={() => openEdit(s)}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>
                      {new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>{coursLabel(s.coursId)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface-variant)' }}>{s.objectifs.length > 60 ? s.objectifs.slice(0, 60) + '…' : s.objectifs}</td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <select value={s.statut} onChange={e => handleStatutChange(s, e.target.value as StatutSeance)}
                        style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg, border: 'none', cursor: 'pointer' }}>
                        {(Object.entries(STATUT_SEANCE_LABELS) as [StatutSeance, string][]).map(([k, l]) => (
                          <option key={k} value={k}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(s) }}
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

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px 28px',
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 24 }}>
              {editing ? 'Modifier la séance' : 'Nouvelle séance'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FField label="Cours *">
                <select value={form.coursId} onChange={e => setForm(f => ({ ...f, coursId: e.target.value }))} style={inp}>
                  {cours.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                </select>
              </FField>
              <FField label="Date *">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
              </FField>
            </div>

            <FField label="Objectifs de la séance *">
              <textarea value={form.objectifs} onChange={e => setForm(f => ({ ...f, objectifs: e.target.value }))}
                rows={3} placeholder="Ex : Présenter le Notre Père et son sens…" style={{ ...inp, resize: 'vertical' }} />
            </FField>

            <FField label="Notes de préparation">
              <textarea value={form.notesPreparation} onChange={e => setForm(f => ({ ...f, notesPreparation: e.target.value }))}
                rows={4} placeholder="Matériel nécessaire, déroulé, activités…" style={{ ...inp, resize: 'vertical' }} />
            </FField>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 8, opacity: saving ? 0.7 : 1 }}>
                {saving && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>}
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer la séance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer cette séance ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>La séance du {new Date(confirmDelete.date).toLocaleDateString('fr-FR')} sera définitivement supprimée.</p>
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
