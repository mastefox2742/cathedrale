import { useEffect, useRef, useState } from 'react'
import {
  getHomelies, createHomelie, updateHomelie, deleteHomelie,
  uploadAudio, type Homelie,
} from '../../services/homelies'

const EMPTY: Omit<Homelie, 'id' | 'createdAt' | 'updatedAt'> = {
  titre: '', pretre: '', date: '', texte: '',
  audioUrl: '', audioPath: '', liturgieRef: '', publie: false,
}

export function AdminHomeliesPage() {
  const [homelies, setHomelies] = useState<Homelie[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Homelie | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioName, setAudioName] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Homelie | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [tab, setTab] = useState<'texte' | 'audio'>('texte')
  const audioRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      setHomelies(await getHomelies(false))
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
    setAudioFile(null)
    setAudioName('')
    setTab('texte')
    setShowForm(true)
  }

  function openEdit(h: Homelie) {
    setEditing(h)
    setForm({
      titre: h.titre, pretre: h.pretre, date: h.date, texte: h.texte,
      audioUrl: h.audioUrl || '', audioPath: h.audioPath || '',
      liturgieRef: h.liturgieRef || '', publie: h.publie,
    })
    setAudioFile(null)
    setAudioName(h.audioUrl ? 'Fichier existant' : '')
    setTab('texte')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.titre || !form.date || !form.pretre) return showToast('Titre, prêtre et date obligatoires', 'err')
    setSaving(true)
    try {
      let audioUrl = form.audioUrl || ''
      let audioPath = form.audioPath || ''

      if (audioFile) {
        const tempId = editing?.id || `tmp_${Date.now()}`
        const up = await uploadAudio(audioFile, tempId)
        audioUrl = up.url
        audioPath = up.path
      }

      const payload = { ...form, audioUrl, audioPath }

      if (editing?.id) {
        await updateHomelie(editing.id, payload)
        showToast('Homélie mise à jour ✓')
      } else {
        await createHomelie(payload)
        showToast('Homélie créée ✓')
      }
      setShowForm(false)
      await load()
    } catch {
      showToast('Erreur lors de la sauvegarde', 'err')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(h: Homelie) {
    setDeletingId(h.id!)
    try {
      await deleteHomelie(h.id!, h.audioPath)
      showToast('Homélie supprimée')
      setConfirmDelete(null)
      await load()
    } catch {
      showToast('Erreur suppression', 'err')
    } finally {
      setDeletingId(null)
    }
  }

  async function togglePublie(h: Homelie) {
    await updateHomelie(h.id!, { publie: !h.publie })
    await load()
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, fontFamily: 'var(--font-sans)' }}>

      {/* Toast */}
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

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
            Gestion des Homélies
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {homelies.length} homélie{homelies.length > 1 ? 's' : ''} · Texte & audio
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouvelle homélie
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : homelies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>record_voice_over</span>
          <p>Aucune homélie. Publiez la première !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {homelies.map(h => (
            <div key={h.id} className="card" style={{
              padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center',
              opacity: h.publie ? 1 : 0.65,
              borderLeft: '4px solid var(--primary)',
            }}>
              {/* Icône audio/texte */}
              <div style={{
                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: h.audioUrl ? 'rgba(0,35,111,0.08)' : 'var(--surface-container)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 26, fontVariationSettings: "'FILL' 1",
                  color: h.audioUrl ? 'var(--primary)' : 'var(--outline-variant)',
                }}>
                  {h.audioUrl ? 'graphic_eq' : 'article'}
                </span>
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                  {h.audioUrl && (
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(0,35,111,0.08)', color: 'var(--primary)' }}>
                      🎙 Audio
                    </span>
                  )}
                  {h.liturgieRef && (
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                      {h.liturgieRef}
                    </span>
                  )}
                  {!h.publie && (
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.06)', color: 'var(--on-surface-variant)' }}>
                      Brouillon
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {h.titre}
                </p>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  {h.pretre} · {h.date}
                </p>
              </div>

              {/* Lecteur audio inline si disponible */}
              {h.audioUrl && (
                <audio controls src={h.audioUrl} style={{ height: 36, maxWidth: 180 }} />
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => togglePublie(h)} title={h.publie ? 'Dépublier' : 'Publier'}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: h.publie ? '#e8f5e9' : 'var(--surface-container)', color: h.publie ? '#2e7d32' : 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{h.publie ? 'visibility' : 'visibility_off'}</span>
                </button>
                <button onClick={() => openEdit(h)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,35,111,0.06)', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                </button>
                <button onClick={() => setConfirmDelete(h)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffebee', color: '#c62828' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
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
            width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 24 }}>
              {editing ? 'Modifier l\'homélie' : 'Nouvelle homélie'}
            </h2>

            {/* Infos principales */}
            <HField label="Titre *">
              <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Ex : Homélie du 27e Dimanche Ordinaire" style={inp} />
            </HField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
              <HField label="Prêtre *">
                <input value={form.pretre} onChange={e => setForm(f => ({ ...f, pretre: e.target.value }))}
                  placeholder="Abbé Jean-Paul M." style={inp} />
              </HField>
              <HField label="Date *">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
              </HField>
            </div>

            <HField label="Référence liturgique">
              <input value={form.liturgieRef} onChange={e => setForm(f => ({ ...f, liturgieRef: e.target.value }))}
                placeholder="Ex : Jn 6, 41–51" style={inp} />
            </HField>

            {/* Onglets texte / audio */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface-container)', borderRadius: 10, padding: 4 }}>
              {(['texte', 'audio'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-sans)',
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? 'var(--primary)' : 'var(--on-surface-variant)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t === 'texte' ? 'article' : 'mic'}</span>
                  {t === 'texte' ? 'Texte intégral' : 'Fichier audio'}
                </button>
              ))}
            </div>

            {tab === 'texte' ? (
              <HField label="Texte de l'homélie">
                <textarea
                  value={form.texte}
                  onChange={e => setForm(f => ({ ...f, texte: e.target.value }))}
                  rows={8}
                  placeholder="Saisissez le texte complet de l'homélie…"
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }}
                />
              </HField>
            ) : (
              <HField label="Fichier audio (MP3, M4A, WAV)">
                <div
                  onClick={() => audioRef.current?.click()}
                  style={{
                    border: '2px dashed var(--outline-variant)', borderRadius: 12,
                    padding: 24, textAlign: 'center', cursor: 'pointer',
                    background: 'var(--surface-container-low)',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--outline-variant)')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: audioName ? 'var(--primary)' : 'var(--outline-variant)', display: 'block', marginBottom: 8, fontVariationSettings: "'FILL' 1" }}>
                    {audioName ? 'graphic_eq' : 'upload_file'}
                  </span>
                  <p style={{ fontSize: 14, color: audioName ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: audioName ? 600 : 400 }}>
                    {audioName || 'Cliquez pour choisir un fichier audio'}
                  </p>
                  {!audioName && <p style={{ fontSize: 11, color: 'var(--outline)', marginTop: 4 }}>MP3, M4A, WAV — max 50 Mo</p>}
                </div>
                <input ref={audioRef} type="file" accept="audio/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); setAudioName(f.name) } }} />
                {form.audioUrl && !audioFile && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 6 }}>Audio actuel :</p>
                    <audio controls src={form.audioUrl} style={{ width: '100%', height: 40 }} />
                  </div>
                )}
                {audioName && (
                  <button onClick={() => { setAudioFile(null); setAudioName(''); setForm(f => ({ ...f, audioUrl: '', audioPath: '' })) }}
                    style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#c62828' }}>
                    ✕ Retirer le fichier
                  </button>
                )}
              </HField>
            )}

            {/* Publication */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 24 }}>
              <input type="checkbox" checked={form.publie} onChange={e => setForm(f => ({ ...f, publie: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>visibility</span>
              <span style={{ fontSize: 14, color: 'var(--on-surface)' }}>Publier cette homélie</span>
            </label>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 8, opacity: saving ? 0.7 : 1 }}>
                {saving && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>}
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Publier l\'homélie'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer cette homélie ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>
              « {confirmDelete.titre} » et son fichier audio seront définitivement supprimés.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={!!deletingId}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#c62828', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                {deletingId && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span>}
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

function HField({ label, children }: { label: string; children: React.ReactNode }) {
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
