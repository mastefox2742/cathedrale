import { useEffect, useState } from 'react'
import {
  getProjetsDons, createProjetDon, updateProjetDon, deleteProjetDon, formatXAF, type ProjetDon,
} from '../../services/dons'

const EMPTY: Omit<ProjetDon, 'id' | 'collecte' | 'createdAt' | 'updatedAt'> = {
  titre: '', description: '', objectif: 1_000_000, emoji: '🏛️', publie: false,
}

export function AdminProjetsDonsPage() {
  const [projets, setProjets] = useState<ProjetDon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProjetDon | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ProjetDon | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try { setProjets(await getProjetsDons(false)) }
    catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null); setForm({ ...EMPTY }); setShowForm(true)
  }

  function openEdit(p: ProjetDon) {
    setEditing(p)
    setForm({ titre: p.titre, description: p.description, objectif: p.objectif, emoji: p.emoji, publie: p.publie })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.titre || !form.description) return showToast('Titre et description obligatoires', 'err')
    if (!form.objectif || form.objectif <= 0) return showToast("L'objectif doit être supérieur à 0", 'err')
    setSaving(true)
    try {
      if (editing?.id) {
        await updateProjetDon(editing.id, form)
        showToast('Projet mis à jour ✓')
      } else {
        await createProjetDon(form)
        showToast('Projet créé ✓')
      }
      setShowForm(false)
      await load()
    } catch { showToast('Erreur sauvegarde', 'err') }
    finally { setSaving(false) }
  }

  async function handleDelete(p: ProjetDon) {
    try {
      await deleteProjetDon(p.id!)
      showToast('Projet supprimé')
      setConfirmDelete(null)
      await load()
    } catch { showToast('Erreur suppression', 'err') }
  }

  async function togglePublie(p: ProjetDon) {
    await updateProjetDon(p.id!, { publie: !p.publie })
    await load()
  }

  const totalCollecte = projets.reduce((s, p) => s + p.collecte, 0)
  const totalObjectif = projets.reduce((s, p) => s + p.objectif, 0)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, fontFamily: 'var(--font-sans)' }}>

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
            Projets de dons
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {projets.length} projet{projets.length > 1 ? 's' : ''} · Suivi de la collecte réelle par projet
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouveau projet
        </button>
      </div>

      {!loading && projets.length > 0 && (
        <div className="card" style={{ padding: '18px 24px', marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 4 }}>Total collecté</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#2e7d32', fontWeight: 700 }}>{formatXAF(totalCollecte)}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 4 }}>Objectif cumulé</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', fontWeight: 700 }}>{formatXAF(totalObjectif)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : projets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>volunteer_activism</span>
          <p>Aucun projet. Créez le premier !</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projets.map(p => {
            const pct = Math.min(100, Math.round((p.collecte / p.objectif) * 100))
            return (
              <div key={p.id} className="card" style={{ padding: '20px', opacity: p.publie ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: 'var(--surface-container)', fontSize: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{p.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 2 }}>{p.titre}</p>
                    {!p.publie && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.06)', color: 'var(--on-surface-variant)' }}>Brouillon</span>}
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.55, marginBottom: 14 }}>{p.description}</p>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>{formatXAF(p.collecte)}</span>
                    <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{formatXAF(p.objectif)}</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,.06)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: pct >= 80 ? '#388E3C' : 'var(--primary)', width: `${pct}%`, transition: 'width .4s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4, textAlign: 'right' }}>{pct}% collecté</p>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => togglePublie(p)} title={p.publie ? 'Dépublier' : 'Publier'}
                    style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.publie ? '#e8f5e9' : 'var(--surface-container)', color: p.publie ? '#2e7d32' : 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: "'FILL' 1" }}>{p.publie ? 'visibility' : 'visibility_off'}</span>
                  </button>
                  <button onClick={() => openEdit(p)}
                    style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,35,111,0.06)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                  </button>
                  <button onClick={() => setConfirmDelete(p)}
                    style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffebee', color: '#c62828' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                  </button>
                </div>
              </div>
            )
          })}
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
              {editing ? 'Modifier le projet' : 'Nouveau projet'}
            </h2>

            <FField label="Titre *">
              <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Ex : Rénovation de la cathédrale" style={inp} />
            </FField>

            <FField label="Description *">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Décrivez le projet…" style={{ ...inp, resize: 'vertical' }} />
            </FField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 16 }}>
              <FField label="Objectif (FCFA) *">
                <input type="number" min="1" value={form.objectif} onChange={e => setForm(f => ({ ...f, objectif: Number(e.target.value) }))} style={inp} />
              </FField>
              <FField label="Emoji">
                <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                  placeholder="🏛️" style={{ ...inp, textAlign: 'center', fontSize: 20 }} />
              </FField>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 24, marginTop: 4 }}>
              <input type="checkbox" checked={form.publie} onChange={e => setForm(f => ({ ...f, publie: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <span style={{ fontSize: 14, color: 'var(--on-surface)' }}>Publier maintenant (sélectionnable sur /dons)</span>
            </label>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 8, opacity: saving ? 0.7 : 1 }}>
                {saving && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>}
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer le projet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer ce projet ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>« {confirmDelete.titre} » sera définitivement supprimé. Les dons déjà enregistrés pour ce projet resteront en base mais ne seront plus rattachés à aucun projet visible.</p>
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
