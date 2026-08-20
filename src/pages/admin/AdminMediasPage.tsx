import { useEffect, useRef, useState } from 'react'
import {
  getMedias, addMedia, deleteMedia, uploadMedia, formatSize,
  type Media, type MediaType,
} from '../../services/medias'

const TABS: { value: MediaType | 'all'; label: string; icon: string }[] = [
  { value: 'all',      label: 'Tout',      icon: 'grid_view' },
  { value: 'photo',    label: 'Photos',    icon: 'image' },
  { value: 'document', label: 'Documents', icon: 'description' },
  { value: 'audio',    label: 'Audio',     icon: 'graphic_eq' },
  { value: 'video',    label: 'Vidéos',    icon: 'play_circle' },
]

const TYPE_CONFIG: Record<MediaType, { icon: string; color: string; bg: string; accept: string; folder: string }> = {
  photo:    { icon: 'image',        color: '#2e7d32', bg: '#e8f5e9', accept: 'image/*',             folder: 'photos' },
  document: { icon: 'description',  color: '#00236f', bg: '#e3f2fd', accept: '.pdf,.doc,.docx',     folder: 'documents' },
  audio:    { icon: 'graphic_eq',   color: '#7b1fa2', bg: '#f3e5f5', accept: 'audio/*',             folder: 'audio' },
  video:    { icon: 'play_circle',  color: '#c62828', bg: '#ffebee', accept: '',                    folder: 'videos' },
}

export function AdminMediasPage() {
  const [medias, setMedias] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<MediaType | 'all'>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadType, setUploadType] = useState<MediaType>('photo')
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Media | null>(null)
  const [preview, setPreview] = useState<Media | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try { setMedias(await getMedias()) }
    catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = tab === 'all' ? medias : medias.filter(m => m.type === tab)

  function openUpload(type: MediaType) {
    setUploadType(type)
    setFile(null); setNom(''); setDescription(''); setVideoUrl(''); setProgress(0)
    setShowUpload(true)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); if (!nom) setNom(f.name.split('.')[0]) }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { setFile(f); if (!nom) setNom(f.name.split('.')[0]) }
  }

  async function handleUpload() {
    if (!nom) return showToast('Nom obligatoire', 'err')
    if (uploadType !== 'video' && !file) return showToast('Fichier obligatoire', 'err')
    if (uploadType === 'video' && !videoUrl) return showToast('URL vidéo obligatoire', 'err')

    setUploading(true)
    try {
      let url = videoUrl
      let storagePath = ''
      let taille = 0

      if (uploadType !== 'video' && file) {
        const cfg = TYPE_CONFIG[uploadType]
        const up = await uploadMedia(file, cfg.folder, setProgress)
        url = up.url; storagePath = up.path; taille = file.size
      }

      await addMedia({ nom, type: uploadType, url, storagePath, taille, categorie: uploadType, description })
      showToast('Média ajouté ✓')
      setShowUpload(false)
      await load()
    } catch { showToast('Erreur lors de l\'upload', 'err') }
    finally { setUploading(false) }
  }

  async function handleDelete(m: Media) {
    try {
      await deleteMedia(m.id!, m.storagePath)
      showToast('Supprimé')
      setConfirmDelete(null)
      await load()
    } catch { showToast('Erreur suppression', 'err') }
  }

  // Extrait ID YouTube pour thumbnail
  function youtubeThumb(url: string) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'var(--font-sans)' }}>

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
            Médiathèque
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {medias.length} fichier{medias.length > 1 ? 's' : ''} · Photos, documents, audio & vidéos
          </p>
        </div>
        {/* Boutons upload par type */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['photo', 'document', 'audio', 'video'] as MediaType[]).map(type => {
            const cfg = TYPE_CONFIG[type]
            return (
              <button key={type} onClick={() => openUpload(type)}
                title={`Ajouter ${type}`}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: 'none',
                  background: cfg.bg, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Onglets filtre */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface-container)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-sans)',
            background: tab === t.value ? 'white' : 'transparent',
            color: tab === t.value ? 'var(--primary)' : 'var(--on-surface-variant)',
            boxShadow: tab === t.value ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: tab === t.value ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
            {t.label}
            {t.value !== 'all' && (
              <span style={{ fontSize: 11, background: 'var(--surface-container)', borderRadius: 10, padding: '1px 6px', color: 'var(--on-surface-variant)' }}>
                {medias.filter(m => m.type === t.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grille */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline-variant)', display: 'block', marginBottom: 16, fontVariationSettings: "'FILL' 1" }}>perm_media</span>
          <p style={{ fontSize: 16, color: 'var(--on-surface-variant)', marginBottom: 8 }}>Aucun fichier dans cette catégorie</p>
          <p style={{ fontSize: 13, color: 'var(--outline)' }}>Utilisez les boutons ci-dessus pour ajouter des médias</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {filtered.map(m => {
            const cfg = TYPE_CONFIG[m.type]
            const thumb = m.type === 'video' ? youtubeThumb(m.url) : null
            return (
              <div key={m.id} className="card" style={{
                overflow: 'hidden', cursor: 'pointer',
                transition: 'transform 0.18s, box-shadow 0.18s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)' }}
                onClick={() => setPreview(m)}
              >
                {/* Miniature */}
                <div style={{ height: 130, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {m.type === 'photo' ? (
                    <img src={m.url} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : thumb ? (
                    <>
                      <img src={thumb} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'white', fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                      </div>
                    </>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                  )}
                  {/* Badge type */}
                  <span style={{
                    position: 'absolute', top: 8, left: 8,
                    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: cfg.color, color: 'white', textTransform: 'uppercase' as const,
                  }}>{m.type}</span>
                </div>
                {/* Infos */}
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nom}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                      {m.taille ? formatSize(m.taille) : '—'}
                    </p>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(m) }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      color: 'var(--outline-variant)',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal upload */}
      {showUpload && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setShowUpload(false) }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px 28px',
            width: '100%', maxWidth: 520,
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            {/* Titre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: TYPE_CONFIG[uploadType].bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: TYPE_CONFIG[uploadType].color, fontVariationSettings: "'FILL' 1" }}>{TYPE_CONFIG[uploadType].icon}</span>
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)' }}>
                  Ajouter {{ photo: 'une photo', document: 'un document', audio: 'un fichier audio', video: 'une vidéo' }[uploadType]}
                </h2>
              </div>
            </div>

            {/* Sélecteur type */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {(['photo', 'document', 'audio', 'video'] as MediaType[]).map(t => (
                <button key={t} onClick={() => setUploadType(t)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase' as const,
                  background: uploadType === t ? TYPE_CONFIG[t].bg : 'var(--surface-container)',
                  color: uploadType === t ? TYPE_CONFIG[t].color : 'var(--on-surface-variant)',
                  outline: uploadType === t ? `2px solid ${TYPE_CONFIG[t].color}44` : 'none',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, display: 'block', margin: '0 auto 2px', fontVariationSettings: "'FILL' 1" }}>{TYPE_CONFIG[t].icon}</span>
                  {t}
                </button>
              ))}
            </div>

            {/* Zone drop ou URL vidéo */}
            {uploadType !== 'video' ? (
              <div
                ref={dropRef}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)' }}
                onDragLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--outline-variant)'}
                onDrop={handleDrop}
                style={{
                  border: '2px dashed var(--outline-variant)', borderRadius: 12,
                  padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                  background: file ? `${TYPE_CONFIG[uploadType].bg}` : 'var(--surface-container-low)',
                  marginBottom: 16, transition: 'border-color 0.2s',
                }}
              >
                {file ? (
                  <>
                    {uploadType === 'photo'
                      ? <img src={URL.createObjectURL(file)} alt="" style={{ maxHeight: 120, borderRadius: 8, marginBottom: 8, maxWidth: '100%', objectFit: 'contain' }} />
                      : <span className="material-symbols-outlined" style={{ fontSize: 40, color: TYPE_CONFIG[uploadType].color, display: 'block', marginBottom: 8, fontVariationSettings: "'FILL' 1" }}>{TYPE_CONFIG[uploadType].icon}</span>
                    }
                    <p style={{ fontSize: 13, fontWeight: 600, color: TYPE_CONFIG[uploadType].color }}>{file.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>{formatSize(file.size)}</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline-variant)', display: 'block', marginBottom: 8 }}>cloud_upload</span>
                    <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>Glisser-déposer ou cliquer</p>
                    <p style={{ fontSize: 11, color: 'var(--outline)', marginTop: 4 }}>
                      {{ photo: 'JPG, PNG, WebP', document: 'PDF, DOC, DOCX', audio: 'MP3, WAV, M4A' }[uploadType]}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>URL YouTube / Facebook</label>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--outline-variant)', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const }} />
              </div>
            )}

            <input ref={fileRef} type="file" accept={TYPE_CONFIG[uploadType].accept} style={{ display: 'none' }} onChange={handleFileChange} />

            {/* Nom */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>Nom *</label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Messe de Noël 2025"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--outline-variant)', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const }} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>Description (optionnelle)</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Courte description…"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--outline-variant)', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const }} />
            </div>

            {/* Barre de progression */}
            {uploading && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ background: 'var(--surface-container)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: TYPE_CONFIG[uploadType].color, transition: 'width 0.3s' }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4 }}>{progress}% uploadé…</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowUpload(false)} disabled={uploading}>Annuler</button>
              <button className="btn-primary" onClick={handleUpload} disabled={uploading} style={{ gap: 8, opacity: uploading ? 0.7 : 1 }}>
                {uploading && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span>}
                {uploading ? `Upload ${progress}%…` : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal prévisualisation */}
      {preview && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setPreview(null) }}>
          <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', maxWidth: 700, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: 16 }}>{preview.nom}</p>
                {preview.description && <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>{preview.description}</p>}
              </div>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--on-surface-variant)' }}>close</span>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              {preview.type === 'photo' && <img src={preview.url} alt={preview.nom} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 8 }} />}
              {preview.type === 'audio' && <audio controls src={preview.url} style={{ width: '100%' }} />}
              {preview.type === 'video' && (
                <iframe
                  src={preview.url.replace('watch?v=', 'embed/')}
                  style={{ width: '100%', height: 360, border: 'none', borderRadius: 8 }}
                  allowFullScreen
                />
              )}
              {preview.type === 'document' && (
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 64, fontVariationSettings: "'FILL' 1", marginBottom: 16, display: 'block' }}>description</span>
                  <a href={preview.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                    Ouvrir le document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px', maxWidth: 380, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c62828', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer ce fichier ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24 }}>« {confirmDelete.nom} » sera définitivement supprimé.</p>
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
