import { useEffect, useRef, useState } from 'react'
import {
  getAnnonces, createAnnonce, updateAnnonce, deleteAnnonce,
  uploadAnnonceImage, type Annonce, type TagType,
} from '../../services/annonces'

const TAGS: TagType[] = ['Liturgie', 'Formation', 'Prière', 'Événement']
const TAG_COLORS: Record<string, string> = {
  Liturgie: '#00236f', Formation: '#2e7d32', Prière: '#7b1fa2', Événement: '#735c00',
}

const EMPTY: Omit<Annonce, 'id' | 'createdAt' | 'updatedAt'> = {
  titre: '', desc: '', tag: 'Liturgie', date: '', imageUrl: '', imagePath: '', epingle: false, publie: false,
}

export function AdminAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Annonce | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Annonce | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const data = await getAnnonces(false)
      setAnnonces(data)
    } catch {
      showToast('Erreur de chargement', 'err')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY })
    setImageFile(null)
    setImagePreview('')
    setShowForm(true)
  }

  function openEdit(a: Annonce) {
    setEditing(a)
    setForm({
      titre: a.titre, desc: a.desc, tag: a.tag,
      date: a.date, imageUrl: a.imageUrl || '',
      imagePath: a.imagePath || '',
      epingle: a.epingle, publie: a.publie,
    })
    setImageFile(null)
    setImagePreview(a.imageUrl || '')
    setShowForm(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.titre || !form.date) return showToast('Titre et date obligatoires', 'err')
    setSaving(true)
    try {
      let imageUrl = form.imageUrl || ''
      let imagePath = form.imagePath || ''

      if (imageFile) {
        const tempId = editing?.id || `tmp_${Date.now()}`
        const up = await uploadAnnonceImage(imageFile, tempId)
        imageUrl = up.url
        imagePath = up.path
      }

      const payload = { ...form, imageUrl, imagePath }

      if (editing?.id) {
        await updateAnnonce(editing.id, payload)
        showToast('Annonce mise à jour ✓')
      } else {
        await createAnnonce(payload)
        showToast('Annonce créée ✓')
      }

      setShowForm(false)
      await load()
    } catch {
      showToast('Erreur lors de la sauvegarde', 'err')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(a: Annonce) {
    setDeletingId(a.id!)
    try {
      await deleteAnnonce(a.id!, a.imagePath)
      showToast('Annonce supprimée')
      setConfirmDelete(null)
      await load()
    } catch {
      showToast('Erreur lors de la suppression', 'err')
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleEpingle(a: Annonce) {
    await updateAnnonce(a.id!, { epingle: !a.epingle })
    await load()
  }

  async function togglePublie(a: Annonce) {
    await updateAnnonce(a.id!, { publie: !a.publie })
    await load()
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, fontFamily: 'var(--font-sans)' }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'ok' ? '#1b5e20' : '#b71c1c',
          color: 'white', fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp 0.25s ease',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
            {toast.type === 'ok' ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
            Gestion des Annonces
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {annonces.length} annonce{annonces.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouvelle annonce
        </button>
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : annonces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>campaign</span>
          <p>Aucune annonce. Créez la première !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {annonces.map(a => (
            <div key={a.id} className="card" style={{
              padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center',
              opacity: a.publie ? 1 : 0.65,
              borderLeft: `4px solid ${TAG_COLORS[a.tag] || 'var(--primary)'}`,
            }}>
              {/* Miniature image */}
              <div style={{
                width: 60, height: 60, borderRadius: 8, flexShrink: 0,
                background: 'var(--surface-container)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {a.imageUrl
                  ? <img src={a.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--outline-variant)', fontVariationSettings: "'FILL' 1" }}>image</span>
                }
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: `${TAG_COLORS[a.tag]}18`, color: TAG_COLORS[a.tag],
                  }}>{a.tag}</span>
                  {a.epingle && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: 'rgba(115,92,0,0.1)', color: 'var(--secondary)',
                    }}>📌 Épinglée</span>
                  )}
                  {!a.publie && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: 'rgba(0,0,0,0.06)', color: 'var(--on-surface-variant)',
                    }}>Brouillon</span>
                  )}
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titre}</p>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{a.date}</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {/* Publier/Dépublier */}
                <button
                  onClick={() => togglePublie(a)}
                  title={a.publie ? 'Dépublier' : 'Publier'}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: a.publie ? '#e8f5e9' : 'var(--surface-container)',
                    color: a.publie ? '#2e7d32' : 'var(--on-surface-variant)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                    {a.publie ? 'visibility' : 'visibility_off'}
                  </span>
                </button>

                {/* Épingler */}
                <button
                  onClick={() => toggleEpingle(a)}
                  title={a.epingle ? 'Désépingler' : 'Épingler'}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: a.epingle ? 'rgba(115,92,0,0.1)' : 'var(--surface-container)',
                    color: a.epingle ? 'var(--secondary)' : 'var(--on-surface-variant)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: a.epingle ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
                </button>

                {/* Modifier */}
                <button
                  onClick={() => openEdit(a)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,35,111,0.06)', color: 'var(--primary)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                </button>

                {/* Supprimer */}
                <button
                  onClick={() => setConfirmDelete(a)}
                  disabled={deletingId === a.id}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#ffebee', color: '#c62828',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal formulaire ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px 28px',
            width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 24 }}>
              {editing ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
            </h2>

            {/* Titre */}
            <Field label="Titre *">
              <input
                value={form.titre}
                onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Ex : Fête du Sacré-Cœur"
                style={inputStyle}
              />
            </Field>

            {/* Description */}
            <Field label="Description *">
              <textarea
                value={form.desc}
                onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                rows={3}
                placeholder="Décrivez l'annonce en quelques lignes…"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>

            {/* Ligne tag + date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Catégorie">
                <select
                  value={form.tag}
                  onChange={e => setForm(f => ({ ...f, tag: e.target.value as TagType }))}
                  style={inputStyle}
                >
                  {TAGS.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Date *">
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Upload image */}
            <Field label="Image (optionnelle)">
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed var(--outline-variant)', borderRadius: 12,
                  padding: 20, textAlign: 'center', cursor: 'pointer',
                  background: 'var(--surface-container-low)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--outline-variant)')}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--outline-variant)', display: 'block', marginBottom: 8 }}>add_photo_alternate</span>
                    <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Cliquez pour choisir une image</p>
                    <p style={{ fontSize: 11, color: 'var(--outline)' }}>JPG, PNG, WebP — max 5 Mo</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              {imagePreview && (
                <button
                  onClick={() => { setImageFile(null); setImagePreview(''); setForm(f => ({ ...f, imageUrl: '', imagePath: '' })) }}
                  style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#c62828' }}
                >
                  ✕ Supprimer l'image
                </button>
              )}
            </Field>

            {/* Options */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, marginTop: 4 }}>
              {[
                { key: 'epingle', label: 'Épingler', icon: 'push_pin' },
                { key: 'publie', label: 'Publier maintenant', icon: 'visibility' },
              ].map(({ key, label, icon }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form[key as 'epingle' | 'publie']}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>{icon}</span>
                  <span style={{ fontSize: 14, color: 'var(--on-surface)' }}>{label}</span>
                </label>
              ))}
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ gap: 8, opacity: saving ? 0.7 : 1 }}
              >
                {saving && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>}
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer l\'annonce'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation suppression ── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '28px 24px',
            maxWidth: 400, width: '100%',
            boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>
              Supprimer cette annonce ?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>
              « {confirmDelete.titre} » sera définitivement supprimée, y compris son image.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deletingId}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: '#c62828', color: 'white', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {deletingId ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span> : null}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid var(--outline-variant)',
  borderRadius: 10, fontSize: 14, outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
  background: 'white',
}
