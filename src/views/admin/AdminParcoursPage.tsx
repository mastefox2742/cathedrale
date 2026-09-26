'use client'

import { useEffect, useState } from 'react'
import {
  getAllParcours, getStatsParcours, createParcours, updateParcours, deleteParcours,
  getEtapes, createEtape, updateEtape, deleteEtape, TYPE_PARCOURS, APPEL_ACTION, getParcoursReference, dupliquerParcours,
  type Parcours, type ParcoursInput, type Etape, type EtapeInput, type TypeParcours, type AppelAction,
} from '../../services/parcours'
import { slugify } from '../../services/paroisses'
import { useDroits } from '../../contexts/AuthContext'
import { ARCHIDIOCESE } from '../../services/scope'
import { ReferencesDiocesaines } from '../../components/admin/ReferencesDiocesaines'
import { PARISH_STAFF_ROLES, ROLE_LABELS, type ParishRole } from '../../services/auth'
import type { QuizQuestion } from '../../services/catechisme'
import {
  PageAdmin, Chargement, Vide, Modale, BoutonsModale, FField, IconBtn, Pastille, ConfirmationSuppression, inp, useToast,
} from '../../components/admin/ui'

const TYPES = Object.keys(TYPE_PARCOURS) as TypeParcours[]

const VIDE: ParcoursInput = {
  type: 'decouvrir', titre: '', slug: '', description: '', emoji: '✝️', imageUrl: null, duree: '',
  obligatoirePour: [], ordre: 0, publie: false,
}

export function AdminParcoursPage() {
  const toast = useToast()
  const droits = useDroits()
  const [parcours, setParcours] = useState<Parcours[]>([])
  const [stats, setStats] = useState<Map<string, { inscrits: number; termines: number }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<TypeParcours | ''>('')
  const [edition, setEdition] = useState<Parcours | null>(null)
  const [creation, setCreation] = useState(false)
  const [form, setForm] = useState<ParcoursInput>(VIDE)
  const [saving, setSaving] = useState(false)
  const [etapesDe, setEtapesDe] = useState<Parcours | null>(null)
  const [suppr, setSuppr] = useState<Parcours | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([getAllParcours(), getStatsParcours().catch(() => new Map())])
      setParcours(p)
      setStats(s)
    } catch { toast.show('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  function ouvrir(p: Parcours | null) {
    setForm(p ? { ...p } : { ...VIDE, type: filtre || 'decouvrir' })
    setEdition(p)
    setCreation(!p)
  }

  async function enregistrer() {
    if (!form.titre.trim()) return toast.show('Le titre est obligatoire', 'err')
    const data = { ...form, slug: form.slug.trim() || slugify(form.titre) }
    setSaving(true)
    try {
      if (edition) await updateParcours(edition.id, data)
      else await createParcours(data)
      toast.show(edition ? 'Parcours mis à jour ✓' : 'Parcours créé ✓')
      setEdition(null); setCreation(false)
      await load()
    } catch (e) {
      toast.show(e instanceof Error && e.message.includes('duplicate') ? 'Ce lien (slug) est déjà utilisé' : 'Erreur sauvegarde', 'err')
    } finally { setSaving(false) }
  }

  async function basculer(p: Parcours) {
    try { await updateParcours(p.id, { publie: !p.publie }); await load() }
    catch { toast.show('Erreur', 'err') }
  }

  async function supprimer(p: Parcours) {
    try { await deleteParcours(p.id); toast.show('Parcours supprimé'); setSuppr(null); await load() }
    catch { toast.show('Erreur suppression', 'err') }
  }

  const visibles = filtre ? parcours.filter(p => p.type === filtre) : parcours

  return (
    <PageAdmin
      titre="Parcours de foi"
      sousTitre="Évangélisation, catéchuménat, approfondissement, neuvaines, retraites et formations obligatoires"
      action={
        <button className="btn-primary" onClick={() => ouvrir(null)} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouveau parcours
        </button>
      }
    >
      {toast.node}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['', ...TYPES] as const).map(t => (
          <button key={t} onClick={() => setFiltre(t)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: filtre === t ? 'var(--primary)' : 'var(--surface-container)',
            color: filtre === t ? 'white' : 'var(--on-surface-variant)',
          }}>{t ? TYPE_PARCOURS[t].label : 'Tous'}</button>
        ))}
      </div>

      {droits.perimetre && droits.perimetre !== ARCHIDIOCESE && (
        <ReferencesDiocesaines
          titre="Parcours de l'archidiocèse"
          charger={async () => (await getParcoursReference()).map(r => ({ id: r.id, titre: r.titre, emoji: r.emoji, detail: TYPE_PARCOURS[r.type].label }))}
          dupliquer={async id => { await dupliquerParcours(id, droits.perimetre!); await load() }}
          notifier={toast.show}
        />
      )}

      {loading ? <Chargement /> : visibles.length === 0 ? <Vide icone="route" texte="Aucun parcours. Créez le premier !" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {visibles.map(p => {
            const s = stats.get(p.id)
            return (
              <div key={p.id} className="card" style={{ padding: 20, opacity: p.publie ? 1 : 0.7 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'var(--surface-container)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>{p.titre}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Pastille texte={TYPE_PARCOURS[p.type].label} />
                      {p.parishId === null && <Pastille texte="Archidiocèse" ton="orange" />}
                      {!p.publie && <Pastille texte="Brouillon" ton="gris" />}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.55, marginBottom: 10 }}>{p.description}</p>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 14 }}>
                  <strong>{s?.inscrits ?? 0}</strong> inscrit{(s?.inscrits ?? 0) > 1 ? 's' : ''} · <strong>{s?.termines ?? 0}</strong> terminé{(s?.termines ?? 0) > 1 ? 's' : ''}
                  {p.obligatoirePour.length > 0 && <><br />Obligatoire pour : {p.obligatoirePour.map(r => ROLE_LABELS[r]).join(', ')}</>}
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn-outline" onClick={() => setEtapesDe(p)} style={{ padding: '6px 12px', fontSize: 12 }}>Étapes</button>
                  <IconBtn icone={p.publie ? 'visibility' : 'visibility_off'} titre={p.publie ? 'Dépublier' : 'Publier'} ton={p.publie ? 'succes' : 'neutre'} actif onClick={() => basculer(p)} />
                  <IconBtn icone="edit" titre="Modifier" ton="primaire" onClick={() => ouvrir(p)} />
                  <IconBtn icone="delete" titre="Supprimer" ton="danger" onClick={() => setSuppr(p)} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(edition || creation) && (
        <Modale titre={edition ? 'Modifier le parcours' : 'Nouveau parcours'} onClose={() => { setEdition(null); setCreation(false) }} maxWidth={620}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 16 }}>
            <FField label="Titre *"><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} style={inp} /></FField>
            <FField label="Emoji"><input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...inp, textAlign: 'center', fontSize: 20 }} /></FField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FField label="Type">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TypeParcours }))} style={inp}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_PARCOURS[t].label}</option>)}
              </select>
            </FField>
            <FField label="Lien (slug)" aide="Laisser vide pour le générer"><input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} style={inp} /></FField>
          </div>
          <FField label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} /></FField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 16 }}>
            <FField label="Durée affichée"><input value={form.duree ?? ''} onChange={e => setForm(f => ({ ...f, duree: e.target.value }))} placeholder="Ex : 4 étapes · 20 min" style={inp} /></FField>
            <FField label="Ordre"><input type="number" value={form.ordre} onChange={e => setForm(f => ({ ...f, ordre: Number(e.target.value) }))} style={inp} /></FField>
          </div>
          {form.type === 'formation_staff' && (
            <FField label="Obligatoire pour" aide="Apparaît dans le registre du staff et dans le profil des personnes concernées">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PARISH_STAFF_ROLES.map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.obligatoirePour.includes(r)}
                      onChange={e => setForm(f => ({ ...f, obligatoirePour: e.target.checked ? [...f.obligatoirePour, r] : f.obligatoirePour.filter(x => x !== r) as ParishRole[] }))} />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>
            </FField>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
            <input type="checkbox" checked={form.publie} onChange={e => setForm(f => ({ ...f, publie: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            <span style={{ fontSize: 14 }}>Publier (visible sur le site)</span>
          </label>
          <BoutonsModale onAnnuler={() => { setEdition(null); setCreation(false) }} onValider={enregistrer} enCours={saving} libelle={edition ? 'Mettre à jour' : 'Créer le parcours'} />
        </Modale>
      )}

      {etapesDe && <EtapesModale parcours={etapesDe} onClose={() => { setEtapesDe(null); load() }} notifier={toast.show} />}
      {suppr && <ConfirmationSuppression texte={`« ${suppr.titre} » et toutes ses étapes seront supprimés, ainsi que la progression des participants.`} onAnnuler={() => setSuppr(null)} onConfirmer={() => supprimer(suppr)} />}
    </PageAdmin>
  )
}

// ── Étapes d'un parcours ────────────────────────────────────────────────────

function EtapesModale({ parcours, onClose, notifier }: { parcours: Parcours; onClose: () => void; notifier: (m: string, t?: 'ok' | 'err') => void }) {
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<Etape | 'nouvelle' | null>(null)

  async function load() {
    setLoading(true)
    try { setEtapes(await getEtapes(parcours.id)) }
    catch { notifier('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [parcours.id])

  async function supprimer(e: Etape) {
    try { await deleteEtape(e.id); await load() } catch { notifier('Erreur suppression', 'err') }
  }

  async function deplacer(i: number, delta: number) {
    const a = etapes[i], b = etapes[i + delta]
    if (!a || !b) return
    try {
      await Promise.all([updateEtape(a.id, { ordre: b.ordre }), updateEtape(b.id, { ordre: a.ordre })])
      await load()
    } catch { notifier('Erreur', 'err') }
  }

  if (edit) {
    return (
      <EtapeForm
        parcours={parcours}
        etape={edit === 'nouvelle' ? null : edit}
        ordre={edit === 'nouvelle' ? (etapes.at(-1)?.ordre ?? 0) + 1 : edit.ordre}
        onClose={async (saved) => { setEdit(null); if (saved) { notifier('Étape enregistrée ✓'); await load() } }}
        notifier={notifier}
      />
    )
  }

  return (
    <Modale titre={`Étapes — ${parcours.titre}`} onClose={onClose} maxWidth={680}>
      {loading ? <Chargement /> : etapes.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>Aucune étape. Ajoutez la première.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {etapes.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-container)' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)', width: 22 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{e.titre}</p>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  {e.videoUrl ? 'Vidéo · ' : ''}{e.quiz.length > 0 ? `${e.quiz.length} question(s) · ` : ''}{e.appelAction !== 'aucun' ? APPEL_ACTION[e.appelAction].label : ''}
                </p>
              </div>
              <IconBtn icone="arrow_upward" titre="Monter" onClick={() => deplacer(i, -1)} />
              <IconBtn icone="arrow_downward" titre="Descendre" onClick={() => deplacer(i, 1)} />
              <IconBtn icone="edit" titre="Modifier" ton="primaire" onClick={() => setEdit(e)} />
              <IconBtn icone="delete" titre="Supprimer" ton="danger" onClick={() => supprimer(e)} />
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <button className="btn-primary" onClick={() => setEdit('nouvelle')}>+ Ajouter une étape</button>
        <button className="btn-outline" onClick={onClose}>Fermer</button>
      </div>
    </Modale>
  )
}

function EtapeForm({ parcours, etape, ordre, onClose, notifier }: {
  parcours: Parcours; etape: Etape | null; ordre: number
  onClose: (saved: boolean) => void; notifier: (m: string, t?: 'ok' | 'err') => void
}) {
  const [form, setForm] = useState<EtapeInput>(etape ? { ...etape } : {
    pathId: parcours.id, ordre, titre: '', contenu: '', videoUrl: '', quiz: [], appelAction: 'aucun',
  })
  const [saving, setSaving] = useState(false)

  function setQuestion(i: number, q: Partial<QuizQuestion>) {
    setForm(f => ({ ...f, quiz: f.quiz.map((x, j) => j === i ? { ...x, ...q } : x) }))
  }

  async function enregistrer() {
    if (!form.titre.trim()) return notifier('Le titre est obligatoire', 'err')
    const quiz = form.quiz
      .map(q => ({ ...q, reponses: q.reponses.map(r => r.trim()).filter(Boolean) }))
      .filter(q => q.question.trim() && q.reponses.length >= 2)
      .map(q => ({ ...q, bonneReponse: Math.min(q.bonneReponse, q.reponses.length - 1) }))
    setSaving(true)
    try {
      if (etape) await updateEtape(etape.id, { ...form, quiz })
      else await createEtape({ ...form, quiz })
      onClose(true)
    } catch { notifier('Erreur sauvegarde', 'err') }
    finally { setSaving(false) }
  }

  return (
    <Modale titre={etape ? "Modifier l'étape" : 'Nouvelle étape'} onClose={() => onClose(false)} maxWidth={720}>
      <FField label="Titre *"><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} style={inp} /></FField>
      <FField label="Contenu" aide="Mise en forme : ## titre, > citation, - liste, **gras**, *italique*">
        <textarea value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} rows={10} style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
      </FField>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <FField label="Vidéo YouTube (facultatif)"><input value={form.videoUrl ?? ''} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=…" style={inp} /></FField>
        <FField label="Appel à l'action">
          <select value={form.appelAction} onChange={e => setForm(f => ({ ...f, appelAction: e.target.value as AppelAction }))} style={inp}>
            {(Object.keys(APPEL_ACTION) as AppelAction[]).map(a => <option key={a} value={a}>{APPEL_ACTION[a].label}</option>)}
          </select>
        </FField>
      </div>

      <FField label={`Quiz (${form.quiz.length} question${form.quiz.length > 1 ? 's' : ''})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {form.quiz.map((q, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 12, background: 'var(--surface-container)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={q.question} onChange={e => setQuestion(i, { question: e.target.value })} placeholder={`Question ${i + 1}`} style={inp} />
                <IconBtn icone="delete" titre="Retirer la question" ton="danger" onClick={() => setForm(f => ({ ...f, quiz: f.quiz.filter((_, j) => j !== i) }))} />
              </div>
              {[0, 1, 2, 3].map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input type="radio" name={`bonne-${i}`} checked={q.bonneReponse === r} onChange={() => setQuestion(i, { bonneReponse: r })} title="Bonne réponse" />
                  <input value={q.reponses[r] ?? ''} onChange={e => { const rep = [...q.reponses]; rep[r] = e.target.value; setQuestion(i, { reponses: rep }) }}
                    placeholder={`Réponse ${String.fromCharCode(65 + r)}${r >= 2 ? ' (facultative)' : ''}`} style={{ ...inp, padding: '8px 12px' }} />
                </label>
              ))}
              <input value={q.explication ?? ''} onChange={e => setQuestion(i, { explication: e.target.value })} placeholder="Explication affichée après la réponse" style={{ ...inp, padding: '8px 12px', marginTop: 4 }} />
            </div>
          ))}
          <button type="button" className="btn-outline" style={{ alignSelf: 'flex-start' }}
            onClick={() => setForm(f => ({ ...f, quiz: [...f.quiz, { question: '', reponses: ['', ''], bonneReponse: 0, explication: '' }] }))}>
            + Ajouter une question
          </button>
        </div>
      </FField>

      <BoutonsModale onAnnuler={() => onClose(false)} onValider={enregistrer} enCours={saving} libelle={etape ? 'Mettre à jour' : "Créer l'étape"} />
    </Modale>
  )
}
