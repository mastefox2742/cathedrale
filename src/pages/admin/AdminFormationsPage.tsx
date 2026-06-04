import { useEffect, useState } from 'react'
import {
  getFormations, createFormation, updateFormation, deleteFormation, type Formation,
} from '../../services/formations'

const ACCENTS = [
  { label: 'Bleu (Primaire)',  value: 'var(--primary)' },
  { label: 'Or (Secondaire)', value: 'var(--secondary)' },
  { label: 'Vert (Ordinaire)',value: 'var(--liturgy-green)' },
  { label: 'Rouge (Martyrs)', value: 'var(--liturgy-red)' },
  { label: 'Violet (Carême)', value: 'var(--liturgy-purple)' },
]

const ICONS = ['emoji_nature', 'local_dining', 'whatshot', 'water_drop', 'auto_stories', 'school', 'groups', 'church', 'star', 'favorite']

const EMPTY: Omit<Formation, 'id' | 'createdAt' | 'updatedAt'> = {
  titre: '', description: '', tranche: '', modules: 12,
  accent: 'var(--primary)', icon: 'school', actif: true,
}

export function AdminFormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Formation | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Formation | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try { setFormations(await getFormations()) }
    catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null); setForm({ ...EMPTY }); setShowForm(true)
  }

  function openEdit(f: Formation) {
    setEditing(f)
    setForm({ titre: f.titre, description: f.description, tranche: f.tranche, modules: f.modules, accent: f.accent, icon: f.icon, actif: f.actif })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.titre || !form.tranche) return showToast('Titre et tranche d\'âge obligatoires', 'err')
    setSaving(true)
    try {
      if (editing?.id) {
        await updateFormation(editing.id, form)
        showToast('Parcours mis à jour ✓')
      } else {
        await createFormation(form)
        showToast('Parcours créé ✓')
      }
      setShowForm(false)
      await load()
    } catch { showToast('Erreur sauvegarde', 'err') }
    finally { setSaving(false) }
  }

  async function handleDelete(f: Formation) {
    try {
      await deleteFormation(f.id!)
      showToast('Parcours supprimé')
      setConfirmDelete(null)
      await load()
    } catch { showToast('Erreur suppression', 'err') }
  }

  async function toggleActif(f: Formation) {
    await updateFormation(f.id!, { actif: !f.actif })
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
            Parcours de Formation
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {formations.length} parcours · Catéchèse & Formation des laïcs
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouveau parcours
        </button>
      </div>

      {/* Grille des parcours */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : formations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>school</span>
          <p>Aucun parcours. Créez le premier !</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {formations.map(f => (
            <div key={f.id} className="card" style={{
              padding: '20px', borderLeft: `4px solid ${f.accent}`,
              opacity: f.actif ? 1 : 0.55, transition: 'box-shadow 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: `${f.accent}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: f.accent, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 2 }}>{f.titre}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${f.accent}14`, color: f.accent }}>{f.tranche}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>{f.modules} modules</span>
                    {!f.actif && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.06)', color: 'var(--on-surface-variant)' }}>Inactif</span>}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.55, marginBottom: 16 }}>{f.description}</p>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => toggleActif(f)} title={f.actif ? 'Désactiver' : 'Activer'}
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.actif ? '#e8f5e9' : 'var(--surface-container)', color: f.actif ? '#2e7d32' : 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: "'FILL' 1" }}>{f.actif ? 'toggle_on' : 'toggle_off'}</span>
                </button>
                <button onClick={() => openEdit(f)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,35,111,0.06)', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                </button>
                <button onClick={() => setConfirmDelete(f)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffebee', color: '#c62828' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
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
              {editing ? 'Modifier le parcours' : 'Nouveau parcours'}
            </h2>

            <FField label="Titre *">
              <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Ex : Éveil à la Foi" style={inp} />
            </FField>

            <FField label="Description *">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Décrivez le parcours…" style={{ ...inp, resize: 'vertical' }} />
            </FField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FField label="Tranche d'âge *">
                <input value={form.tranche} onChange={e => setForm(f => ({ ...f, tranche: e.target.value }))}
                  placeholder="Ex : 6 – 8 ans" style={inp} />
              </FField>
              <FField label="Nombre de modules">
                <input type="number" min={1} max={100} value={form.modules}
                  onChange={e => setForm(f => ({ ...f, modules: +e.target.value }))} style={inp} />
              </FField>
            </div>

            {/* Couleur accent */}
            <FField label="Couleur liturgique">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ACCENTS.map(({ label, value }) => (
                  <button key={value} onClick={() => setForm(f => ({ ...f, accent: value }))}
                    title={label}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: value,
                      outline: form.accent === value ? '3px solid #333' : '2px solid transparent',
                      outlineOffset: 2,
                    }} />
                ))}
              </div>
            </FField>

            {/* Icône */}
            <FField label="Icône">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                    style={{
                      width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: form.icon === ic ? `${form.accent}18` : 'var(--surface-container)',
                      outline: form.icon === ic ? `2px solid ${form.accent}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: form.icon === ic ? form.accent : 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>{ic}</span>
                  </button>
                ))}
              </div>
            </FField>

            {/* Aperçu */}
            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 20,
              borderLeft: `4px solid ${form.accent}`,
              background: `${form.accent}06`, border: `1px solid ${form.accent}20`,
            }}>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 6 }}>Aperçu</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${form.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: form.accent, fontVariationSettings: "'FILL' 1" }}>{form.icon}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--on-surface)' }}>{form.titre || 'Titre du parcours'}</p>
                  <p style={{ fontSize: 12, color: form.accent, fontWeight: 600 }}>{form.tranche || 'Tranche d\'âge'} · {form.modules} modules</p>
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 24 }}>
              <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <span style={{ fontSize: 14, color: 'var(--on-surface)' }}>Parcours actif (visible sur l'application)</span>
            </label>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 8, opacity: saving ? 0.7 : 1 }}>
                {saving && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>}
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer le parcours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer ce parcours ?</h3>
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
