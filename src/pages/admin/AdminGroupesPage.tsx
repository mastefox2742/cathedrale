import { useEffect, useState } from 'react'
import {
  getGroupes, createGroupe, updateGroupe, deleteGroupe, type Groupe,
} from '../../services/groupes'

const CATEGORIES = [
  { value: 'jeunesse', label: 'Jeunesse' },
  { value: 'catechisme', label: 'Catéchisme' },
  { value: 'choeur', label: 'Chœur & musique' },
  { value: 'liturgie', label: 'Service liturgique' },
  { value: 'biblique', label: 'Groupe biblique' },
  { value: 'association', label: 'Association paroissiale' },
  { value: 'famille', label: 'Mouvement de familles' },
  { value: 'benevolat', label: 'Bénévolat & solidarité' },
]

const EMPTY: Omit<Groupe, 'id' | 'createdAt' | 'updatedAt'> = {
  titre: '', description: '', categorie: 'jeunesse', responsable: '', horaire: '', contact: '', icon: '🙏', publie: false,
}

export function AdminGroupesPage() {
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Groupe | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Groupe | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try { setGroupes(await getGroupes(false)) }
    catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null); setForm({ ...EMPTY }); setShowForm(true)
  }

  function openEdit(g: Groupe) {
    setEditing(g)
    setForm({
      titre: g.titre, description: g.description, categorie: g.categorie,
      responsable: g.responsable || '', horaire: g.horaire || '', contact: g.contact || '',
      icon: g.icon, publie: g.publie,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.titre || !form.description) return showToast('Titre et description obligatoires', 'err')
    setSaving(true)
    try {
      if (editing?.id) {
        await updateGroupe(editing.id, form)
        showToast('Groupe mis à jour ✓')
      } else {
        await createGroupe(form)
        showToast('Groupe créé ✓')
      }
      setShowForm(false)
      await load()
    } catch { showToast('Erreur sauvegarde', 'err') }
    finally { setSaving(false) }
  }

  async function handleDelete(g: Groupe) {
    try {
      await deleteGroupe(g.id!)
      showToast('Groupe supprimé')
      setConfirmDelete(null)
      await load()
    } catch { showToast('Erreur suppression', 'err') }
  }

  async function togglePublie(g: Groupe) {
    await updateGroupe(g.id!, { publie: !g.publie })
    await load()
  }

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

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
            Groupes & Mouvements
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {groupes.length} groupe{groupes.length > 1 ? 's' : ''} · Vitrine des groupes paroissiaux
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouveau groupe
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : groupes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>groups</span>
          <p>Aucun groupe. Créez le premier !</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {groupes.map(g => (
            <div key={g.id} className="card" style={{ padding: '20px', opacity: g.publie ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: 'var(--surface-container)', fontSize: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{g.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 2 }}>{g.titre}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(0,35,111,0.08)', color: 'var(--primary)' }}>
                      {CATEGORIES.find(c => c.value === g.categorie)?.label ?? g.categorie}
                    </span>
                    {!g.publie && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.06)', color: 'var(--on-surface-variant)' }}>Brouillon</span>}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.55, marginBottom: 10 }}>{g.description}</p>
              {(g.responsable || g.horaire) && (
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
                  {g.responsable && <>Responsable : <strong>{g.responsable}</strong><br /></>}
                  {g.horaire}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => togglePublie(g)} title={g.publie ? 'Dépublier' : 'Publier'}
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: g.publie ? '#e8f5e9' : 'var(--surface-container)', color: g.publie ? '#2e7d32' : 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: "'FILL' 1" }}>{g.publie ? 'visibility' : 'visibility_off'}</span>
                </button>
                <button onClick={() => openEdit(g)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,35,111,0.06)', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                </button>
                <button onClick={() => setConfirmDelete(g)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffebee', color: '#c62828' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
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
              {editing ? 'Modifier le groupe' : 'Nouveau groupe'}
            </h2>

            <FField label="Titre *">
              <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Ex : Chapelet du Rosaire" style={inp} />
            </FField>

            <FField label="Description *">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Décrivez le groupe…" style={{ ...inp, resize: 'vertical' }} />
            </FField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 16 }}>
              <FField label="Catégorie">
                <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} style={inp}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FField>
              <FField label="Icône">
                <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="📿" style={{ ...inp, textAlign: 'center', fontSize: 20 }} />
              </FField>
            </div>

            <FField label="Responsable">
              <input value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                placeholder="Ex : Mme Angélique M." style={inp} />
            </FField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FField label="Horaire">
                <input value={form.horaire} onChange={e => setForm(f => ({ ...f, horaire: e.target.value }))}
                  placeholder="Ex : Lun–Ven · 18h00" style={inp} />
              </FField>
              <FField label="Contact (tél. ou email)">
                <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                  placeholder="Ex : +242 06 000 00 00" style={inp} />
              </FField>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 24, marginTop: 4 }}>
              <input type="checkbox" checked={form.publie} onChange={e => setForm(f => ({ ...f, publie: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <span style={{ fontSize: 14, color: 'var(--on-surface)' }}>Publier maintenant (visible sur le site)</span>
            </label>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 8, opacity: saving ? 0.7 : 1 }}>
                {saving && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>}
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer le groupe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer ce groupe ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>« {confirmDelete.titre} » sera définitivement supprimé.</p>
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
