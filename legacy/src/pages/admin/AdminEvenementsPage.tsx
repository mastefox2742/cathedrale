import { useEffect, useState } from 'react'
import {
  getAllEvenements, addEvenement, updateEvenement, deleteEvenement,
  type Evenement, type EvenementType, type PlatformType,
} from '../../services/evenements'

const TYPE_LABELS: Record<EvenementType, string> = {
  live: '🔴 Live', replay: '▶ Replay', evenement: '📅 Événement',
}
const PLATFORM_LABELS: Record<PlatformType, { label: string; color: string }> = {
  youtube:  { label: 'YouTube',  color: '#FF0000' },
  facebook: { label: 'Facebook', color: '#1877F2' },
}

const EMPTY: Omit<Evenement, 'id' | 'createdAt'> = {
  titre: '', description: '', type: 'live', platform: 'youtube',
  url: '', date: new Date().toISOString().slice(0, 10), heure: '',
  estEnLive: false, publie: true,
}

export function AdminEvenementsPage() {
  const [items, setItems] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Evenement, 'id' | 'createdAt'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try { setItems(await getAllEvenements()) } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  function openNew() { setForm(EMPTY); setEditId(null); setShowForm(true) }
  function openEdit(ev: Evenement) {
    setForm({ titre: ev.titre, description: ev.description, type: ev.type, platform: ev.platform,
      url: ev.url, date: ev.date, heure: ev.heure ?? '', estEnLive: ev.estEnLive ?? false, publie: ev.publie })
    setEditId(ev.id!)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.titre.trim() || !form.url.trim() || !form.date) return
    setSaving(true)
    try {
      if (editId) {
        await updateEvenement(editId, form)
        showToast('Événement mis à jour ✓')
      } else {
        await addEvenement(form)
        showToast('Événement ajouté ✓')
      }
      setShowForm(false)
      await load()
    } catch (e) { showToast('Erreur lors de la sauvegarde', false) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteEvenement(deleteId)
      showToast('Supprimé ✓')
      await load()
    } catch (_) { showToast('Erreur de suppression', false) }
    finally { setDeleteId(null) }
  }

  async function toggleLive(ev: Evenement) {
    await updateEvenement(ev.id!, { estEnLive: !ev.estEnLive })
    await load()
  }

  async function togglePublie(ev: Evenement) {
    await updateEvenement(ev.id!, { publie: !ev.publie })
    await load()
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 200,
          background: toast.ok ? '#2e7d32' : '#c62828', color: 'white',
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--primary)' }}>
            Médias & Événements
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Lives YouTube & Facebook, replays, grands événements
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, border: 'none',
            background: 'var(--primary)', color: 'white',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Ajouter
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <p style={{ color: 'var(--on-surface-variant)' }}>Chargement…</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48 }}>videocam_off</span>
          <p style={{ marginTop: 8 }}>Aucun événement. Cliquez sur « Ajouter » pour commencer.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(ev => (
            <div key={ev.id} style={{
              background: 'white', borderRadius: 14, padding: 16,
              display: 'flex', gap: 14, alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,35,111,0.07)',
              border: ev.estEnLive ? '2px solid #ff3b30' : '1px solid rgba(0,35,111,0.08)',
              opacity: ev.publie ? 1 : 0.6,
            }}>
              {/* Thumbnail */}
              {ev.thumbnail ? (
                <img src={ev.thumbnail} alt="" style={{ width: 80, height: 55, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 80, height: 55, borderRadius: 8, flexShrink: 0,
                  background: PLATFORM_LABELS[ev.platform].color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
                    {ev.platform === 'youtube' ? 'smart_display' : 'play_circle'}
                  </span>
                </div>
              )}

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: ev.estEnLive ? '#ff3b30' : 'var(--surface-container)',
                    color: ev.estEnLive ? 'white' : 'var(--on-surface-variant)',
                  }}>
                    {ev.estEnLive ? '🔴 EN DIRECT' : TYPE_LABELS[ev.type]}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: PLATFORM_LABELS[ev.platform].color + '18',
                    color: PLATFORM_LABELS[ev.platform].color,
                  }}>
                    {PLATFORM_LABELS[ev.platform].label}
                  </span>
                </div>
                <p style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.titre}
                </p>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {ev.heure && ` · ${ev.heure}`}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => toggleLive(ev)}
                  title={ev.estEnLive ? 'Arrêter le live' : 'Marquer comme LIVE'}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: ev.estEnLive ? '#ff3b30' : 'rgba(255,59,48,0.1)', color: ev.estEnLive ? 'white' : '#ff3b30',
                  }}
                >
                  {ev.estEnLive ? '⏹ Arrêter' : '🔴 Live'}
                </button>
                <button
                  onClick={() => togglePublie(ev)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: ev.publie ? 'rgba(0,35,111,0.08)' : 'rgba(0,0,0,0.05)',
                    color: ev.publie ? 'var(--primary)' : 'var(--on-surface-variant)',
                  }}
                >
                  {ev.publie ? '👁 Publié' : '🙈 Masqué'}
                </button>
                <button onClick={() => openEdit(ev)} style={{
                  padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'var(--surface-container)', color: 'var(--on-surface)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                </button>
                <button onClick={() => setDeleteId(ev.id!)} style={{
                  padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(198,40,40,0.08)', color: '#c62828',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 28,
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 20 }}>
              {editId ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>

            {[
              { label: 'Titre *', field: 'titre', type: 'text', placeholder: 'Ex: Messe de Noël en direct' },
              { label: 'Description', field: 'description', type: 'textarea', placeholder: 'Courte description…' },
              { label: 'URL YouTube ou Facebook *', field: 'url', type: 'url', placeholder: 'https://youtube.com/watch?v=...' },
              { label: 'Date *', field: 'date', type: 'date', placeholder: '' },
              { label: 'Heure', field: 'heure', type: 'text', placeholder: 'Ex: 10h30' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', display: 'block', marginBottom: 6 }}>{label}</label>
                {type === 'textarea' ? (
                  <textarea
                    value={(form as never)[field] as string}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    rows={2}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', fontSize: 14, fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    type={type}
                    value={(form as never)[field] as string}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', display: 'block', marginBottom: 6 }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EvenementType }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', fontSize: 14, fontFamily: 'var(--font-sans)', background: 'white' }}>
                  <option value="live">🔴 Live</option>
                  <option value="replay">▶ Replay</option>
                  <option value="evenement">📅 Événement</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', display: 'block', marginBottom: 6 }}>Plateforme</label>
                <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as PlatformType }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', fontSize: 14, fontFamily: 'var(--font-sans)', background: 'white' }}>
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.estEnLive} onChange={e => setForm(f => ({ ...f, estEnLive: e.target.checked }))} />
                <span>🔴 Marquer comme EN DIRECT</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.publie} onChange={e => setForm(f => ({ ...f, publie: e.target.checked }))} />
                <span>Publié</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)',
                background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--on-surface-variant)',
              }}>Annuler</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.titre.trim() || !form.url.trim()}
                style={{
                  flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                  background: 'var(--primary)', color: 'white',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  opacity: saving || !form.titre.trim() || !form.url.trim() ? 0.6 : 1,
                }}
              >
                {saving ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 360, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer l'événement ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 20 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#c62828', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
