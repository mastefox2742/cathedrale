import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCours, addCours, updateCours,
  getAllModules, addModule, updateModule, deleteModule,
  type Cours, type Module, type QuizQuestion, type NiveauType,
  SEED_COURS_EVEIL, SEED_MODULES_EVEIL,
} from '../../services/catechisme'

// ── Couleurs par niveau ────────────────────────────────────────────────────────
const NIVEAU_CONFIG: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Éveil à la Foi',       emoji: '🌿', color: '#2e7d32' },
  2: { label: 'Première Communion',   emoji: '🍞', color: '#1565C0' },
  3: { label: 'Confirmation',         emoji: '🔥', color: '#C62828' },
  4: { label: 'RICA — Adultes',       emoji: '💧', color: '#735C00' },
}

// ── Types formulaires ──────────────────────────────────────────────────────────
const EMPTY_COURS: Omit<Cours, 'id' | 'createdAt'> = {
  niveau: 1, titre: '', tranche: '', description: '', objectif: '',
  emoji: '📚', couleur: '#2e7d32', totalModules: 0, publie: true,
}

const EMPTY_MODULE: Omit<Module, 'id' | 'createdAt' | 'coursId'> = {
  ordre: 1, titre: '', sousTitre: '', emoji: '📖',
  contenu: '', activite: '', priere: '', quiz: [], publie: true,
}

const EMPTY_QUESTION: QuizQuestion = {
  question: '', reponses: ['', '', '', ''], bonneReponse: 0, explication: '',
}

// ── Composant Quiz Editor ─────────────────────────────────────────────────────
function QuizEditor({ quiz, onChange }: { quiz: QuizQuestion[]; onChange: (q: QuizQuestion[]) => void }) {
  function addQ() { onChange([...quiz, { ...EMPTY_QUESTION }]) }
  function removeQ(i: number) { onChange(quiz.filter((_, idx) => idx !== i)) }
  function updateQ(i: number, field: keyof QuizQuestion, value: unknown) {
    onChange(quiz.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }
  function updateReponse(qi: number, ri: number, val: string) {
    const q = { ...quiz[qi], reponses: quiz[qi].reponses.map((r, i) => i === ri ? val : r) }
    onChange(quiz.map((item, idx) => idx === qi ? q : item))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
          Questions du quiz ({quiz.length}/5)
        </label>
        {quiz.length < 5 && (
          <button onClick={addQ} style={{
            padding: '6px 12px', borderRadius: 8, border: 'none',
            background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            + Ajouter une question
          </button>
        )}
      </div>

      {quiz.map((q, qi) => (
        <div key={qi} style={{
          background: 'var(--surface-container)', borderRadius: 12, padding: 14, marginBottom: 10,
          border: '1px solid rgba(0,35,111,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>Question {qi + 1}</span>
            <button onClick={() => removeQ(qi)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
          <input
            placeholder="Texte de la question *"
            value={q.question}
            onChange={e => updateQ(qi, 'question', e.target.value)}
            style={INPUT_STYLE}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '8px 0' }}>
            {q.reponses.map((r, ri) => (
              <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name={`bonne-${qi}`}
                  checked={q.bonneReponse === ri}
                  onChange={() => updateQ(qi, 'bonneReponse', ri)}
                  style={{ cursor: 'pointer' }}
                />
                <input
                  placeholder={`Réponse ${String.fromCharCode(65 + ri)} ${ri === 0 ? '(bonne par défaut)' : ''}`}
                  value={r}
                  onChange={e => updateReponse(qi, ri, e.target.value)}
                  style={{ ...INPUT_STYLE, flex: 1, margin: 0, borderColor: q.bonneReponse === ri ? '#2e7d32' : undefined }}
                />
              </div>
            ))}
          </div>
          <input
            placeholder="Explication (affichée après la réponse)"
            value={q.explication ?? ''}
            onChange={e => updateQ(qi, 'explication', e.target.value)}
            style={INPUT_STYLE}
          />
        </div>
      ))}
      {quiz.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', textAlign: 'center', padding: '12px 0' }}>
          Aucune question. Cliquez sur "Ajouter une question" pour commencer.
        </p>
      )}
    </div>
  )
}

// ── Styles communs ─────────────────────────────────────────────────────────────
const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 14,
  border: '1.5px solid rgba(0,35,111,0.15)', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box', background: 'white', marginBottom: 10,
}
const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, resize: 'vertical', fontFamily: 'var(--font-serif)', lineHeight: 1.6,
}

// ── Page principale ────────────────────────────────────────────────────────────
export function AdminCatechismePage() {
  const navigate = useNavigate()
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCours, setSelectedCours] = useState<Cours | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loadingModules, setLoadingModules] = useState(false)

  // Formulaire cours
  const [showCoursForm, setShowCoursForm] = useState(false)
  const [coursForm, setCoursForm] = useState<Omit<Cours, 'id' | 'createdAt'>>(EMPTY_COURS)
  const [editCoursId, setEditCoursId] = useState<string | null>(null)

  // Formulaire module
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [moduleForm, setModuleForm] = useState<Omit<Module, 'id' | 'createdAt' | 'coursId'>>(EMPTY_MODULE)
  const [editModuleId, setEditModuleId] = useState<string | null>(null)
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadCours() {
    setLoading(true)
    try {
      const data = await getCours()
      // Si aucun cours en base, proposer de créer le cours Éveil à la Foi
      setCours(data)
    } catch (_) { setCours([]) }
    finally { setLoading(false) }
  }

  async function loadModules(c: Cours) {
    setSelectedCours(c)
    setLoadingModules(true)
    try {
      const mods = await getAllModules(c.id!)
      setModules(mods)
    } catch (_) { setModules([]) }
    finally { setLoadingModules(false) }
  }

  useEffect(() => { void loadCours() }, [])

  // ── Cours CRUD ───────────────────────────────────────────────────────────────
  function openNewCours() {
    setCoursForm(EMPTY_COURS)
    setEditCoursId(null)
    setShowCoursForm(true)
  }

  function openEditCours(c: Cours) {
    setCoursForm({ niveau: c.niveau, titre: c.titre, tranche: c.tranche, description: c.description,
      objectif: c.objectif, emoji: c.emoji, couleur: c.couleur, totalModules: c.totalModules, publie: c.publie })
    setEditCoursId(c.id!)
    setShowCoursForm(true)
  }

  async function saveCours() {
    if (!coursForm.titre.trim()) return
    setSaving(true)
    try {
      if (editCoursId) {
        await updateCours(editCoursId, coursForm)
        showToast('Cours mis à jour ✓')
      } else {
        await addCours(coursForm)
        showToast('Cours créé ✓')
      }
      setShowCoursForm(false)
      await loadCours()
    } catch (_) { showToast('Erreur', false) }
    finally { setSaving(false) }
  }

  async function seedEveil() {
    setSaving(true)
    try {
      const coursId = await addCours(SEED_COURS_EVEIL)
      for (const mod of SEED_MODULES_EVEIL) {
        await addModule({ ...mod, coursId })
      }
      showToast('Cours Éveil à la Foi créé avec 8 modules ✓')
      await loadCours()
    } catch (_) { showToast('Erreur lors du seed', false) }
    finally { setSaving(false) }
  }

  // ── Module CRUD ──────────────────────────────────────────────────────────────
  function openNewModule() {
    setModuleForm({ ...EMPTY_MODULE, ordre: modules.length + 1 })
    setEditModuleId(null)
    setShowModuleForm(true)
  }

  function openEditModule(m: Module) {
    setModuleForm({ ordre: m.ordre, titre: m.titre, sousTitre: m.sousTitre ?? '', emoji: m.emoji,
      contenu: m.contenu, activite: m.activite ?? '', priere: m.priere, quiz: m.quiz, publie: m.publie })
    setEditModuleId(m.id!)
    setShowModuleForm(true)
  }

  async function saveModule() {
    if (!moduleForm.titre.trim() || !selectedCours) return
    setSaving(true)
    try {
      if (editModuleId) {
        await updateModule(editModuleId, moduleForm)
        showToast('Module mis à jour ✓')
      } else {
        await addModule({ ...moduleForm, coursId: selectedCours.id! })
        showToast('Module créé ✓')
      }
      setShowModuleForm(false)
      await loadModules(selectedCours)
      // Mettre à jour le compteur totalModules
      const newTotal = editModuleId ? modules.length : modules.length + 1
      await updateCours(selectedCours.id!, { totalModules: newTotal })
    } catch (_) { showToast('Erreur', false) }
    finally { setSaving(false) }
  }

  async function handleDeleteModule() {
    if (!deleteModuleId || !selectedCours) return
    try {
      await deleteModule(deleteModuleId)
      showToast('Module supprimé ✓')
      await loadModules(selectedCours)
    } catch (_) { showToast('Erreur', false) }
    finally { setDeleteModuleId(null) }
  }

  async function toggleModulePublie(m: Module) {
    await updateModule(m.id!, { publie: !m.publie })
    await loadModules(selectedCours!)
  }

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 200,
          background: toast.ok ? '#2e7d32' : '#c62828', color: 'white',
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--primary)' }}>
            Plateforme Catéchisme
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Gérez les cours et leurs modules de contenu
          </p>
        </div>
        <button onClick={openNewCours} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 10, border: 'none',
          background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouveau cours
        </button>
      </div>

      {/* Vue split : liste cours | modules */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCours ? '320px 1fr' : '1fr', gap: 20 }}>

        {/* ── Liste des cours ── */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 12 }}>
            Parcours ({cours.length})
          </h2>

          {loading ? (
            <p style={{ color: 'var(--on-surface-variant)' }}>Chargement…</p>
          ) : cours.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--surface-container)', borderRadius: 14 }}>
              <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 12 }}>
                Aucun cours créé.
              </p>
              <button
                onClick={seedEveil}
                disabled={saving}
                style={{
                  padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: '#2e7d32', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                🌿 Créer Éveil à la Foi (8 modules)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cours.map(c => {
                const cfg = NIVEAU_CONFIG[c.niveau] ?? NIVEAU_CONFIG[1]
                const isSelected = selectedCours?.id === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => loadModules(c)}
                    style={{
                      padding: '14px', borderRadius: 14, cursor: 'pointer',
                      background: isSelected ? c.couleur : 'white',
                      color: isSelected ? 'white' : 'var(--on-surface)',
                      boxShadow: '0 2px 8px rgba(0,35,111,0.07)',
                      border: isSelected ? 'none' : '1px solid rgba(0,35,111,0.08)',
                      borderLeft: `4px solid ${c.couleur}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{c.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.titre}</p>
                        <p style={{ fontSize: 12, opacity: 0.75 }}>{c.tranche} · {c.totalModules} modules</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={e => { e.stopPropagation(); openEditCours(c) }}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                            background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--surface-container)',
                            color: isSelected ? 'white' : 'var(--on-surface)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Modules du cours sélectionné ── */}
        {selectedCours && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>
                  {selectedCours.emoji} {selectedCours.titre} — Modules
                </h2>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  Cliquez sur un module pour le modifier · glissez pour réordonner
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => navigate(`/catechese/${selectedCours.id}`)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1.5px solid var(--primary)',
                    background: 'white', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>visibility</span>
                  Aperçu
                </button>
                <button onClick={openNewModule} style={{
                  padding: '8px 14px', borderRadius: 10, border: 'none',
                  background: selectedCours.couleur, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
                  Nouveau module
                </button>
              </div>
            </div>

            {loadingModules ? (
              <p style={{ color: 'var(--on-surface-variant)' }}>Chargement des modules…</p>
            ) : modules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--surface-container)', borderRadius: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>menu_book</span>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>Aucun module. Cliquez sur "Nouveau module".</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {modules.map((m, i) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'white', borderRadius: 12, padding: '12px 14px',
                      boxShadow: '0 2px 6px rgba(0,35,111,0.06)',
                      border: '1px solid rgba(0,35,111,0.08)',
                      borderLeft: `4px solid ${selectedCours.couleur}`,
                      opacity: m.publie ? 1 : 0.6,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', width: 20 }}>{m.ordre}</span>
                    <span style={{ fontSize: 24 }}>{m.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>{m.titre}</p>
                      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                        {m.sousTitre} · {m.quiz.length} questions
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleModulePublie(m)}
                        style={{
                          padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          background: m.publie ? 'rgba(0,35,111,0.08)' : 'rgba(0,0,0,0.05)',
                          color: m.publie ? 'var(--primary)' : 'var(--on-surface-variant)',
                        }}
                      >
                        {m.publie ? '👁 Publié' : '🙈 Masqué'}
                      </button>
                      <button onClick={() => openEditModule(m)} style={{
                        padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'var(--surface-container)', color: 'var(--on-surface)',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      <button onClick={() => setDeleteModuleId(m.id!)} style={{
                        padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(198,40,40,0.08)', color: '#c62828',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal formulaire cours ─────────────────────────────────────────────── */}
      {showCoursForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 20 }}>
              {editCoursId ? 'Modifier le cours' : 'Nouveau cours'}
            </h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Niveau</label>
              <select value={coursForm.niveau} onChange={e => setCoursForm(f => ({ ...f, niveau: Number(e.target.value) as NiveauType }))}
                style={{ ...INPUT_STYLE, marginBottom: 0 }}>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{NIVEAU_CONFIG[n].emoji} {NIVEAU_CONFIG[n].label}</option>)}
              </select>
            </div>
            {[
              { label: 'Titre *', field: 'titre', placeholder: 'Ex: Éveil à la Foi' },
              { label: 'Tranche d\'âge *', field: 'tranche', placeholder: 'Ex: 6 – 8 ans' },
              { label: 'Emoji', field: 'emoji', placeholder: '🌿' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
                <input value={(coursForm as never)[field] as string} onChange={e => setCoursForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} style={{ ...INPUT_STYLE, marginBottom: 0 }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</label>
              <textarea value={coursForm.description} onChange={e => setCoursForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...TEXTAREA_STYLE, marginBottom: 0 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Objectif pédagogique</label>
              <textarea value={coursForm.objectif} onChange={e => setCoursForm(f => ({ ...f, objectif: e.target.value }))} rows={2} style={{ ...TEXTAREA_STYLE, marginBottom: 0 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Couleur</label>
              <input type="color" value={coursForm.couleur} onChange={e => setCoursForm(f => ({ ...f, couleur: e.target.value }))} style={{ width: 48, height: 36, borderRadius: 8, border: '1px solid rgba(0,35,111,0.15)', cursor: 'pointer' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
              <input type="checkbox" checked={coursForm.publie} onChange={e => setCoursForm(f => ({ ...f, publie: e.target.checked }))} />
              Publié (visible sur le site)
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCoursForm(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={saveCours} disabled={saving || !coursForm.titre.trim()} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Enregistrement…' : editCoursId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal formulaire module ────────────────────────────────────────────── */}
      {showModuleForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 20 }}>
              {editModuleId ? 'Modifier le module' : 'Nouveau module'} — {selectedCours?.titre}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={LABEL_STYLE}>Ordre *</label>
                <input type="number" value={moduleForm.ordre} onChange={e => setModuleForm(f => ({ ...f, ordre: Number(e.target.value) }))} style={{ ...INPUT_STYLE, marginBottom: 0 }} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Emoji</label>
                <input value={moduleForm.emoji} onChange={e => setModuleForm(f => ({ ...f, emoji: e.target.value }))} placeholder="📖" style={{ ...INPUT_STYLE, marginBottom: 0 }} />
              </div>
            </div>

            {[
              { label: 'Titre *', field: 'titre', placeholder: 'Ex: Qui est Dieu ?' },
              { label: 'Sous-titre', field: 'sousTitre', placeholder: 'Ex: Le Père qui nous aime' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={LABEL_STYLE}>{label}</label>
                <input value={(moduleForm as never)[field] as string} onChange={e => setModuleForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} style={{ ...INPUT_STYLE, marginBottom: 0 }} />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL_STYLE}>
                Contenu principal *
                <span style={{ fontWeight: 400, color: 'var(--on-surface-variant)', marginLeft: 8 }}>
                  (Markdown : ## Titre, **gras**, - liste, &gt; citation)
                </span>
              </label>
              <textarea
                value={moduleForm.contenu}
                onChange={e => setModuleForm(f => ({ ...f, contenu: e.target.value }))}
                rows={8}
                placeholder="## Titre de section&#10;&#10;Contenu du module en markdown...&#10;&#10;**Texte en gras**, - liste&#10;&#10;> Citation biblique"
                style={{ ...TEXTAREA_STYLE, marginBottom: 0 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL_STYLE}>Activité pratique</label>
              <textarea value={moduleForm.activite} onChange={e => setModuleForm(f => ({ ...f, activite: e.target.value }))} rows={3} placeholder="**Activité :** Description de l'activité..." style={{ ...TEXTAREA_STYLE, marginBottom: 0 }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>Prière de fin *</label>
              <textarea value={moduleForm.priere} onChange={e => setModuleForm(f => ({ ...f, priere: e.target.value }))} rows={4} placeholder="Seigneur..." style={{ ...TEXTAREA_STYLE, marginBottom: 0 }} />
            </div>

            <div style={{ borderTop: '1px solid rgba(0,35,111,0.1)', paddingTop: 20, marginBottom: 20 }}>
              <QuizEditor quiz={moduleForm.quiz} onChange={quiz => setModuleForm(f => ({ ...f, quiz }))} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
              <input type="checkbox" checked={moduleForm.publie} onChange={e => setModuleForm(f => ({ ...f, publie: e.target.checked }))} />
              Module publié
            </label>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowModuleForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button
                onClick={saveModule}
                disabled={saving || !moduleForm.titre.trim() || !moduleForm.contenu.trim() || !moduleForm.priere.trim()}
                style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: selectedCours?.couleur ?? 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Enregistrement…' : editModuleId ? 'Mettre à jour' : 'Créer le module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression module ───────────────────────────────────── */}
      {deleteModuleId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 360, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer ce module ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 20 }}>Le contenu et le quiz seront définitivement supprimés.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteModuleId(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button onClick={handleDeleteModule} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#c62828', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)',
  display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em',
}
