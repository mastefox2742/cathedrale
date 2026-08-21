import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCours, addCours, updateCours,
  getAllModules, addModule, updateModule, deleteModule,
  getAllFormationsCatechisme, addFormationCatechisme, updateFormationCatechisme, deleteFormationCatechisme,
  getAllLecons, addLecon, updateLecon, deleteLecon,
  type Cours, type Module, type Lecon, type TypeLecon, type QuizQuestion, type NiveauType, type FormationCatechisme,
  TYPE_LECON_LABELS,
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
  emoji: '📚', couleur: '#2e7d32', totalModules: 0, publie: true, formationId: '',
}

const EMPTY_FORMATION: Omit<FormationCatechisme, 'id' | 'createdAt' | 'updatedAt'> = {
  titre: '', description: '', emoji: '📚', ordre: 0, publie: true,
}

const EMPTY_MODULE: Omit<Module, 'id' | 'createdAt' | 'coursId'> = {
  ordre: 1, titre: '', sousTitre: '', emoji: '📖', publie: true,
}

const EMPTY_QUESTION: QuizQuestion = {
  question: '', reponses: ['', '', '', ''], bonneReponse: 0, explication: '',
}

const EMPTY_LECON: Omit<Lecon, 'id' | 'createdAt' | 'moduleId'> = {
  ordre: 1, type: 'texte', titre: '', contenu: '', url: '', quiz: [], publie: true,
}

const TYPE_ICONS: Record<TypeLecon, string> = {
  texte: '📝', video: '🎬', audio: '🎧', document: '📄', activite: '🖐️', quiz: '❓',
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

  // Formations (regroupent plusieurs cours/parcours)
  const [formations, setFormations] = useState<FormationCatechisme[]>([])
  const [showFormationForm, setShowFormationForm] = useState(false)
  const [formationForm, setFormationForm] = useState<Omit<FormationCatechisme, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_FORMATION)
  const [editFormationId, setEditFormationId] = useState<string | null>(null)

  // Formulaire cours
  const [showCoursForm, setShowCoursForm] = useState(false)
  const [coursForm, setCoursForm] = useState<Omit<Cours, 'id' | 'createdAt'>>(EMPTY_COURS)
  const [editCoursId, setEditCoursId] = useState<string | null>(null)

  // Formulaire module
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [moduleForm, setModuleForm] = useState<Omit<Module, 'id' | 'createdAt' | 'coursId'>>(EMPTY_MODULE)
  const [editModuleId, setEditModuleId] = useState<string | null>(null)
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null)

  // Leçons du module géré
  const [manageModule, setManageModule] = useState<Module | null>(null)
  const [lecons, setLecons] = useState<Lecon[]>([])
  const [loadingLecons, setLoadingLecons] = useState(false)
  const [showLeconForm, setShowLeconForm] = useState(false)
  const [leconForm, setLeconForm] = useState<Omit<Lecon, 'id' | 'createdAt' | 'moduleId'>>(EMPTY_LECON)
  const [editLeconId, setEditLeconId] = useState<string | null>(null)
  const [deleteLeconId, setDeleteLeconId] = useState<string | null>(null)

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

  async function loadFormations() {
    try { setFormations(await getAllFormationsCatechisme()) } catch (_) { setFormations([]) }
  }

  useEffect(() => { void loadCours(); void loadFormations() }, [])

  // ── Formations CRUD ──────────────────────────────────────────────────────────
  function openNewFormation() {
    setFormationForm(EMPTY_FORMATION)
    setEditFormationId(null)
    setShowFormationForm(true)
  }

  function openEditFormation(f: FormationCatechisme) {
    setFormationForm({ titre: f.titre, description: f.description, emoji: f.emoji, ordre: f.ordre, publie: f.publie })
    setEditFormationId(f.id!)
    setShowFormationForm(true)
  }

  async function saveFormation() {
    if (!formationForm.titre.trim()) return
    setSaving(true)
    try {
      if (editFormationId) {
        await updateFormationCatechisme(editFormationId, formationForm)
        showToast('Formation mise à jour ✓')
      } else {
        await addFormationCatechisme(formationForm)
        showToast('Formation créée ✓')
      }
      setShowFormationForm(false)
      await loadFormations()
    } catch (_) { showToast('Erreur', false) }
    finally { setSaving(false) }
  }

  async function handleDeleteFormation(f: FormationCatechisme) {
    try {
      await deleteFormationCatechisme(f.id!)
      showToast('Formation supprimée ✓')
      await loadFormations()
    } catch (_) { showToast('Erreur suppression', false) }
  }

  // ── Cours CRUD ───────────────────────────────────────────────────────────────
  function openNewCours() {
    setCoursForm(EMPTY_COURS)
    setEditCoursId(null)
    setShowCoursForm(true)
  }

  function openEditCours(c: Cours) {
    setCoursForm({ niveau: c.niveau, titre: c.titre, tranche: c.tranche, description: c.description,
      objectif: c.objectif, emoji: c.emoji, couleur: c.couleur, totalModules: c.totalModules, publie: c.publie,
      formationId: c.formationId || '' })
    setEditCoursId(c.id!)
    setShowCoursForm(true)
  }

  const formationLabel = (id?: string) => formations.find(f => f.id === id)?.titre

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

  // ── Module CRUD ──────────────────────────────────────────────────────────────
  function openNewModule() {
    setModuleForm({ ...EMPTY_MODULE, ordre: modules.length + 1 })
    setEditModuleId(null)
    setShowModuleForm(true)
  }

  function openEditModule(m: Module) {
    setModuleForm({ ordre: m.ordre, titre: m.titre, sousTitre: m.sousTitre ?? '', emoji: m.emoji, publie: m.publie })
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

  // ── Leçons CRUD ──────────────────────────────────────────────────────────────
  async function openManageLecons(m: Module) {
    setManageModule(m)
    setLoadingLecons(true)
    try { setLecons(await getAllLecons(m.id!)) } catch (_) { setLecons([]) }
    finally { setLoadingLecons(false) }
  }

  async function reloadLecons() {
    if (!manageModule) return
    try { setLecons(await getAllLecons(manageModule.id!)) } catch (_) { setLecons([]) }
  }

  function openNewLecon() {
    setLeconForm({ ...EMPTY_LECON, ordre: lecons.length + 1 })
    setEditLeconId(null)
    setShowLeconForm(true)
  }

  function openEditLecon(l: Lecon) {
    setLeconForm({ ordre: l.ordre, type: l.type, titre: l.titre, contenu: l.contenu ?? '', url: l.url ?? '', quiz: l.quiz, publie: l.publie })
    setEditLeconId(l.id!)
    setShowLeconForm(true)
  }

  async function saveLecon() {
    if (!leconForm.titre.trim() || !manageModule) return
    setSaving(true)
    try {
      if (editLeconId) {
        await updateLecon(editLeconId, leconForm)
        showToast('Leçon mise à jour ✓')
      } else {
        await addLecon({ ...leconForm, moduleId: manageModule.id! })
        showToast('Leçon créée ✓')
      }
      setShowLeconForm(false)
      await reloadLecons()
    } catch (_) { showToast('Erreur', false) }
    finally { setSaving(false) }
  }

  async function toggleLeconPublie(l: Lecon) {
    await updateLecon(l.id!, { publie: !l.publie })
    await reloadLecons()
  }

  async function handleDeleteLecon() {
    if (!deleteLeconId) return
    try {
      await deleteLecon(deleteLeconId)
      showToast('Leçon supprimée ✓')
      await reloadLecons()
    } catch (_) { showToast('Erreur', false) }
    finally { setDeleteLeconId(null) }
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

      {/* ── Formations (regroupent plusieurs parcours) ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>
            Formations ({formations.length})
          </h2>
          <button onClick={openNewFormation} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--primary)',
            background: 'white', color: 'var(--primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
            Nouvelle formation
          </button>
        </div>
        {formations.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
            Aucune formation. Regroupez vos parcours (ex : « Catéchisme Enfance ») en créant une formation.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {formations.map(f => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                background: 'white', borderRadius: 12, border: '1px solid rgba(0,35,111,0.08)',
                boxShadow: '0 2px 6px rgba(0,35,111,0.06)', opacity: f.publie ? 1 : 0.6,
              }}>
                <span style={{ fontSize: 22 }}>{f.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)' }}>{f.titre}</p>
                  <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                    {cours.filter(c => c.formationId === f.id).length} parcours
                  </p>
                </div>
                <button onClick={() => openEditFormation(f)} style={{ padding: '4px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--surface-container)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                </button>
                <button onClick={() => handleDeleteFormation(f)} style={{ padding: '4px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(198,40,40,0.08)', color: '#c62828' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
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
              <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 4 }}>
                Aucun cours créé.
              </p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                Cliquez sur « Nouveau cours » ci-dessus pour commencer.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cours.map(c => {
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
                        {formationLabel(c.formationId) && (
                          <p style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>📚 {formationLabel(c.formationId)}</p>
                        )}
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
                {modules.map((m) => (
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
                        {m.sousTitre}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => openManageLecons(m)}
                        style={{
                          padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--primary)', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          background: 'white', color: 'var(--primary)',
                        }}
                      >
                        📖 Leçons
                      </button>
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

      {/* ── Modal formulaire formation ─────────────────────────────────────────── */}
      {showFormationForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 20 }}>
              {editFormationId ? 'Modifier la formation' : 'Nouvelle formation'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={LABEL_STYLE}>Titre *</label>
                <input value={formationForm.titre} onChange={e => setFormationForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="Ex : Catéchisme Enfance" style={{ ...INPUT_STYLE, marginBottom: 0 }} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Emoji</label>
                <input value={formationForm.emoji} onChange={e => setFormationForm(f => ({ ...f, emoji: e.target.value }))}
                  placeholder="📚" style={{ ...INPUT_STYLE, marginBottom: 0, textAlign: 'center' }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LABEL_STYLE}>Description</label>
              <textarea value={formationForm.description} onChange={e => setFormationForm(f => ({ ...f, description: e.target.value }))}
                rows={2} style={{ ...TEXTAREA_STYLE, marginBottom: 0 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
              <input type="checkbox" checked={formationForm.publie} onChange={e => setFormationForm(f => ({ ...f, publie: e.target.checked }))} />
              Publiée (visible sur le site)
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowFormationForm(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={saveFormation} disabled={saving || !formationForm.titre.trim()} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Enregistrement…' : editFormationId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Formation</label>
              <select value={coursForm.formationId || ''} onChange={e => setCoursForm(f => ({ ...f, formationId: e.target.value }))}
                style={{ ...INPUT_STYLE, marginBottom: 0 }}>
                <option value="">— Aucune —</option>
                {formations.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.titre}</option>)}
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
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
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

            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 20 }}>
              Le contenu (texte, vidéo, audio, document, activité, quiz) se gère leçon par leçon,
              via le bouton « 📖 Leçons » une fois le module créé.
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
              <input type="checkbox" checked={moduleForm.publie} onChange={e => setModuleForm(f => ({ ...f, publie: e.target.checked }))} />
              Module publié
            </label>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowModuleForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button
                onClick={saveModule}
                disabled={saving || !moduleForm.titre.trim()}
                style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: selectedCours?.couleur ?? 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Enregistrement…' : editModuleId ? 'Mettre à jour' : 'Créer le module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal gestion des leçons d'un module ───────────────────────────────── */}
      {manageModule && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)' }}>
                  {manageModule.emoji} {manageModule.titre} — Leçons
                </h2>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  Le module se termine quand la leçon de type « Quiz » est réussie (ou en cliquant
                  « Terminer le module » sur la dernière leçon s'il n'y a pas de quiz).
                </p>
              </div>
              <button onClick={() => { setManageModule(null); setLecons([]) }} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            <button onClick={openNewLecon} style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
              padding: '8px 14px', borderRadius: 10, border: 'none',
              background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
              Nouvelle leçon
            </button>

            {loadingLecons ? (
              <p style={{ color: 'var(--on-surface-variant)' }}>Chargement…</p>
            ) : lecons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, background: 'var(--surface-container)', borderRadius: 14 }}>
                <p style={{ color: 'var(--on-surface-variant)' }}>Aucune leçon. Cliquez sur « Nouvelle leçon ».</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lecons.map(l => (
                  <div key={l.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--surface-container)', borderRadius: 12, padding: '10px 14px',
                    opacity: l.publie ? 1 : 0.6,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', width: 16 }}>{l.ordre}</span>
                    <span style={{ fontSize: 20 }}>{TYPE_ICONS[l.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)' }}>{l.titre}</p>
                      <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                        {TYPE_LECON_LABELS[l.type]}{l.type === 'quiz' ? ` · ${l.quiz.length} questions` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleLeconPublie(l)}
                        style={{
                          padding: '5px 9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          background: l.publie ? 'rgba(0,35,111,0.08)' : 'rgba(0,0,0,0.05)',
                          color: l.publie ? 'var(--primary)' : 'var(--on-surface-variant)',
                        }}
                      >
                        {l.publie ? '👁' : '🙈'}
                      </button>
                      <button onClick={() => openEditLecon(l)} style={{
                        padding: '5px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'white', color: 'var(--on-surface)',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
                      </button>
                      <button onClick={() => setDeleteLeconId(l.id!)} style={{
                        padding: '5px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(198,40,40,0.08)', color: '#c62828',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal formulaire leçon ──────────────────────────────────────────────── */}
      {showLeconForm && manageModule && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 20 }}>
              {editLeconId ? 'Modifier la leçon' : 'Nouvelle leçon'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={LABEL_STYLE}>Ordre *</label>
                <input type="number" value={leconForm.ordre} onChange={e => setLeconForm(f => ({ ...f, ordre: Number(e.target.value) }))} style={{ ...INPUT_STYLE, marginBottom: 0 }} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Type *</label>
                <select value={leconForm.type} onChange={e => setLeconForm(f => ({ ...f, type: e.target.value as TypeLecon }))} style={{ ...INPUT_STYLE, marginBottom: 0 }}>
                  {(Object.keys(TYPE_LECON_LABELS) as TypeLecon[]).map(t => (
                    <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LECON_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL_STYLE}>Titre *</label>
              <input value={leconForm.titre} onChange={e => setLeconForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ex: Jésus, Fils de Dieu" style={{ ...INPUT_STYLE, marginBottom: 0 }} />
            </div>

            {(leconForm.type === 'texte' || leconForm.type === 'activite') && (
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL_STYLE}>
                  Contenu *
                  <span style={{ fontWeight: 400, color: 'var(--on-surface-variant)', marginLeft: 8 }}>
                    (Markdown : ## Titre, **gras**, - liste, &gt; citation)
                  </span>
                </label>
                <textarea
                  value={leconForm.contenu}
                  onChange={e => setLeconForm(f => ({ ...f, contenu: e.target.value }))}
                  rows={8}
                  placeholder="## Titre de section&#10;&#10;Contenu en markdown...&#10;&#10;**Texte en gras**, - liste&#10;&#10;> Citation biblique"
                  style={{ ...TEXTAREA_STYLE, marginBottom: 0 }}
                />
              </div>
            )}

            {(leconForm.type === 'video' || leconForm.type === 'audio' || leconForm.type === 'document') && (
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL_STYLE}>
                  URL *
                  <span style={{ fontWeight: 400, color: 'var(--on-surface-variant)', marginLeft: 8 }}>
                    {leconForm.type === 'video' && '(YouTube, Vimeo, ou lien direct .mp4)'}
                    {leconForm.type === 'audio' && '(lien direct .mp3/.wav)'}
                    {leconForm.type === 'document' && '(lien direct vers le fichier, ex: PDF)'}
                  </span>
                </label>
                <input value={leconForm.url} onChange={e => setLeconForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" style={{ ...INPUT_STYLE, marginBottom: 0 }} />
              </div>
            )}

            {leconForm.type === 'quiz' && (
              <div style={{ borderTop: '1px solid rgba(0,35,111,0.1)', paddingTop: 16, marginBottom: 14 }}>
                <QuizEditor quiz={leconForm.quiz} onChange={quiz => setLeconForm(f => ({ ...f, quiz }))} />
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
              <input type="checkbox" checked={leconForm.publie} onChange={e => setLeconForm(f => ({ ...f, publie: e.target.checked }))} />
              Leçon publiée
            </label>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLeconForm(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(0,35,111,0.15)', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button
                onClick={saveLecon}
                disabled={saving || !leconForm.titre.trim()}
                style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Enregistrement…' : editLeconId ? 'Mettre à jour' : 'Créer la leçon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression leçon ─────────────────────────────────────── */}
      {deleteLeconId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 130, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 360, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer cette leçon ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 20 }}>Son contenu sera définitivement supprimé.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteLeconId(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button onClick={handleDeleteLecon} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#c62828', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression module ───────────────────────────────────── */}
      {deleteModuleId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 360, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>Supprimer ce module ?</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 20 }}>Toutes ses leçons seront définitivement supprimées.</p>
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
