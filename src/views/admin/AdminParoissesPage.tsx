'use client'

import { useEffect, useState } from 'react'
import { useDroits } from '../../contexts/AuthContext'
import {
  getToutesParoisses, createParoisse, updateParoisse, getMembresStaff, nommerMembre, retirerMembre, slugify,
  type Paroisse, type ParoisseInput, type MembreParoisse, type HoraireMesse,
} from '../../services/paroisses'
import { PARISH_STAFF_ROLES, ROLE_LABELS, type ParishRole } from '../../services/auth'
import {
  PageAdmin, Chargement, Vide, Modale, BoutonsModale, FField, IconBtn, Pastille, inp, useToast,
} from '../../components/admin/ui'

const VIDE: ParoisseInput = {
  nom: '', slug: '', description: '', cure: '', adresse: '', quartier: '', ville: 'Brazzaville',
  latitude: null, longitude: null, telephone: '', email: '', whatsapp: '',
  horaires: { messes: [{ jour: 'Dimanche', horaires: [] }] }, photoUrl: '', actif: true,
}

/** Rôles qu'un administrateur de paroisse peut attribuer (pas les rôles réservés au diocèse). */
const ROLES_NOMMABLES: ParishRole[] = [...PARISH_STAFF_ROLES, 'parent', 'benevole']

export function AdminParoissesPage() {
  const droits = useDroits()
  const toast = useToast()
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [loading, setLoading] = useState(true)
  const [edition, setEdition] = useState<Paroisse | null>(null)
  const [creation, setCreation] = useState(false)
  const [form, setForm] = useState<ParoisseInput>(VIDE)
  const [messesTexte, setMessesTexte] = useState<{ jour: string; horaires: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [equipe, setEquipe] = useState<Paroisse | null>(null)

  async function load() {
    setLoading(true)
    try {
      const toutes = await getToutesParoisses()
      setParoisses(droits.isDiocesanAdmin ? toutes : toutes.filter(p => droits.paroissesStaff.includes(p.id)))
    } catch { toast.show('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  function ouvrir(p: Paroisse | null) {
    const base = p ? { ...p } : VIDE
    setForm({ ...base })
    setMessesTexte((base.horaires.messes ?? []).map(m => ({ jour: m.jour, horaires: m.horaires.join(', ') })))
    setEdition(p)
    setCreation(!p)
  }

  function fermer() { setEdition(null); setCreation(false) }

  async function enregistrer() {
    if (!form.nom.trim()) return toast.show('Le nom est obligatoire', 'err')
    const slug = form.slug.trim() || slugify(form.nom)
    const messes: HoraireMesse[] = messesTexte
      .filter(m => m.jour.trim())
      .map(m => ({ jour: m.jour.trim(), horaires: m.horaires.split(',').map(h => h.trim()).filter(Boolean) }))
    const data: ParoisseInput = { ...form, slug, horaires: { ...form.horaires, messes } }
    setSaving(true)
    try {
      if (edition) await updateParoisse(edition.id, data)
      else await createParoisse(data)
      toast.show(edition ? 'Paroisse mise à jour ✓' : 'Paroisse créée ✓')
      fermer()
      await load()
    } catch (e) {
      toast.show(e instanceof Error && e.message.includes('duplicate') ? 'Ce lien (slug) est déjà utilisé' : 'Erreur sauvegarde', 'err')
    } finally { setSaving(false) }
  }

  async function basculerActif(p: Paroisse) {
    try {
      await updateParoisse(p.id, { actif: !p.actif })
      toast.show(p.actif ? 'Paroisse désactivée' : 'Paroisse réactivée ✓')
      await load()
    } catch { toast.show('Erreur', 'err') }
  }

  const set = <K extends keyof ParoisseInput>(k: K, v: ParoisseInput[K]) => setForm(f => ({ ...f, [k]: v }))

  return (
    <PageAdmin
      titre="Paroisses"
      sousTitre={`${paroisses.length} paroisse${paroisses.length > 1 ? 's' : ''} · Annuaire public, horaires et équipes`}
      action={droits.isDiocesanAdmin && (
        <button className="btn-primary" onClick={() => ouvrir(null)} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nouvelle paroisse
        </button>
      )}
    >
      {toast.node}

      {loading ? <Chargement /> : paroisses.length === 0 ? <Vide icone="church" texte="Aucune paroisse." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {paroisses.map(p => (
            <div key={p.id} className="card" style={{ padding: 20, opacity: p.actif ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>church</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>{p.nom}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.quartier && <Pastille texte={p.quartier} />}
                    {!p.actif && <Pastille texte="Inactive" ton="gris" />}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4 }}>{p.cure ? `Curé : ${p.cure}` : 'Curé non renseigné'}</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 14 }}>
                {(p.horaires.messes ?? []).length} créneau{(p.horaires.messes ?? []).length > 1 ? 'x' : ''} de messe · /paroisses/{p.slug}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <IconBtn icone="groups" titre="Équipe et rôles" ton="primaire" onClick={() => setEquipe(p)} />
                <IconBtn icone="edit" titre="Modifier" ton="primaire" onClick={() => ouvrir(p)} />
                {droits.isDiocesanAdmin && (
                  <IconBtn icone={p.actif ? 'visibility' : 'visibility_off'} titre={p.actif ? 'Désactiver' : 'Réactiver'} ton={p.actif ? 'succes' : 'neutre'} actif onClick={() => basculerActif(p)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(edition || creation) && (
        <Modale titre={edition ? `Modifier — ${edition.nom}` : 'Nouvelle paroisse'} onClose={fermer} maxWidth={680}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <FField label="Nom *"><input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex : Paroisse Saint-Pierre-Claver" style={inp} /></FField>
            <FField label="Lien (slug)" aide="Laisser vide pour le générer"><input value={form.slug} onChange={e => set('slug', slugify(e.target.value))} placeholder="saint-pierre-claver" style={inp} /></FField>
          </div>
          <FField label="Présentation"><textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} /></FField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FField label="Curé"><input value={form.cure ?? ''} onChange={e => set('cure', e.target.value)} placeholder="Abbé …" style={inp} /></FField>
            <FField label="Quartier"><input value={form.quartier ?? ''} onChange={e => set('quartier', e.target.value)} placeholder="Ex : Bacongo" style={inp} /></FField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <FField label="Adresse"><input value={form.adresse ?? ''} onChange={e => set('adresse', e.target.value)} style={inp} /></FField>
            <FField label="Ville"><input value={form.ville} onChange={e => set('ville', e.target.value)} style={inp} /></FField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FField label="Latitude" aide="Pour la carte et « la plus proche »"><input type="number" step="any" value={form.latitude ?? ''} onChange={e => set('latitude', e.target.value === '' ? null : Number(e.target.value))} placeholder="-4.2699" style={inp} /></FField>
            <FField label="Longitude"><input type="number" step="any" value={form.longitude ?? ''} onChange={e => set('longitude', e.target.value === '' ? null : Number(e.target.value))} placeholder="15.2832" style={inp} /></FField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <FField label="Téléphone"><input value={form.telephone ?? ''} onChange={e => set('telephone', e.target.value)} style={inp} /></FField>
            <FField label="Email"><input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} style={inp} /></FField>
            <FField label="WhatsApp"><input value={form.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value)} style={inp} /></FField>
          </div>
          <FField label="Photo (URL)"><input value={form.photoUrl ?? ''} onChange={e => set('photoUrl', e.target.value)} placeholder="https://…" style={inp} /></FField>

          <FField label="Horaires des messes" aide="Un créneau par ligne ; heures séparées par des virgules (ex : 07h00, 09h00)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messesTexte.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 34px', gap: 8 }}>
                  <input value={m.jour} onChange={e => setMessesTexte(l => l.map((x, j) => j === i ? { ...x, jour: e.target.value } : x))} placeholder="Jour(s)" style={inp} />
                  <input value={m.horaires} onChange={e => setMessesTexte(l => l.map((x, j) => j === i ? { ...x, horaires: e.target.value } : x))} placeholder="07h00, 18h30" style={inp} />
                  <IconBtn icone="close" titre="Retirer" ton="danger" onClick={() => setMessesTexte(l => l.filter((_, j) => j !== i))} />
                </div>
              ))}
              <button type="button" className="btn-outline" onClick={() => setMessesTexte(l => [...l, { jour: '', horaires: '' }])} style={{ alignSelf: 'flex-start' }}>+ Ajouter un créneau</button>
            </div>
          </FField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FField label="Confessions"><input value={form.horaires.confessions ?? ''} onChange={e => set('horaires', { ...form.horaires, confessions: e.target.value })} style={inp} /></FField>
            <FField label="Permanence / secrétariat"><input value={form.horaires.permanence ?? ''} onChange={e => set('horaires', { ...form.horaires, permanence: e.target.value })} style={inp} /></FField>
          </div>

          <BoutonsModale onAnnuler={fermer} onValider={enregistrer} enCours={saving} libelle={edition ? 'Mettre à jour' : 'Créer la paroisse'} />
        </Modale>
      )}

      {equipe && <EquipeModale paroisse={equipe} onClose={() => setEquipe(null)} notifier={toast.show} />}
    </PageAdmin>
  )
}

function EquipeModale({ paroisse, onClose, notifier }: { paroisse: Paroisse; onClose: () => void; notifier: (m: string, t?: 'ok' | 'err') => void }) {
  const [membres, setMembres] = useState<MembreParoisse[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ParishRole>('catechiste')
  const [envoi, setEnvoi] = useState(false)

  async function load() {
    setLoading(true)
    try { setMembres(await getMembresStaff(paroisse.id)) }
    catch { notifier('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [paroisse.id])

  async function nommer() {
    if (!email.trim()) return
    setEnvoi(true)
    try {
      await nommerMembre(paroisse.id, email, role)
      setEmail('')
      notifier('Rôle attribué ✓')
      await load()
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur', 'err')
    } finally { setEnvoi(false) }
  }

  async function retirer(m: MembreParoisse) {
    try {
      await retirerMembre(paroisse.id, m.userId, m.role)
      notifier('Rôle retiré')
      await load()
    } catch { notifier('Erreur', 'err') }
  }

  return (
    <Modale titre={`Équipe — ${paroisse.nom}`} onClose={onClose} maxWidth={620}>
      <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
        La personne doit d'abord avoir créé son compte dans l'Espace Membre. Un même compte peut avoir plusieurs rôles.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 8, marginBottom: 20 }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email du compte" style={inp} />
        <select value={role} onChange={e => setRole(e.target.value as ParishRole)} style={inp}>
          {ROLES_NOMMABLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <button className="btn-primary" onClick={nommer} disabled={envoi || !email.trim()} style={{ opacity: envoi ? .7 : 1 }}>Nommer</button>
      </div>

      {loading ? <Chargement /> : membres.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Aucun membre de l'équipe pour l'instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {membres.map(m => (
            <div key={`${m.userId}-${m.role}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-container)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>{m.nom || m.email}</p>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{m.email}</p>
              </div>
              <Pastille texte={ROLE_LABELS[m.role]} />
              <IconBtn icone="person_remove" titre="Retirer ce rôle" ton="danger" onClick={() => retirer(m)} />
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn-outline" onClick={onClose}>Fermer</button>
      </div>
    </Modale>
  )
}
