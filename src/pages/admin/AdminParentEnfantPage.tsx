import { useEffect, useMemo, useState } from 'react'
import {
  getEnfants, addEnfant, updateEnfant, getConsentements, upsertConsentement,
  TYPE_CONSENTEMENT_LABELS,
  type Enfant, type ConsentementParental, type TypeConsentement,
} from '../../services/enfants'
import { getDemandes, type DemandePastorale } from '../../services/demandesPastorales'
import { canManageEnfants } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'

const EMPTY_ENFANT: Omit<Enfant, 'id' | 'createdAt' | 'updatedAt'> = {
  prenom: '', nom: '', dateNaissance: '', parentNom: '', parentContact: '', demandeId: '', notes: '', actif: true,
}

export function AdminParentEnfantPage() {
  const { profile } = useAuth()

  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [demandes, setDemandes] = useState<DemandePastorale[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreActif, setFiltreActif] = useState<'actifs' | 'tous'>('actifs')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_ENFANT)
  const [editId, setEditId] = useState<string | null>(null)

  const [selected, setSelected] = useState<Enfant | null>(null)
  const [consentements, setConsentements] = useState<ConsentementParental[]>([])
  const [loadingConsentements, setLoadingConsentements] = useState(false)
  const [consentForm, setConsentForm] = useState<{ type: TypeConsentement; accorde: boolean; signataire: string; date: string; notes: string }>({
    type: 'participation_activites', accorde: true, signataire: '', date: new Date().toISOString().slice(0, 10), notes: '',
  })

  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const [e, d] = await Promise.all([getEnfants(), getDemandes()])
      setEnfants(e)
      setDemandes(d.filter(x => x.type === 'catechisme'))
    } catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (!canManageEnfants(profile?.role ?? null)) {
    return (
      <div style={{ padding: '32px 36px', fontFamily: 'var(--font-sans)' }}>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>lock</span>
          <p>Accès réservé au personnel en charge du catéchisme et de la sécurité.</p>
        </div>
      </div>
    )
  }

  const filtered = useMemo(() => enfants.filter(e => filtreActif === 'tous' || e.actif), [enfants, filtreActif])

  function openNew(demande?: DemandePastorale) {
    setForm(demande
      ? { ...EMPTY_ENFANT, parentNom: demande.nom, parentContact: demande.contact, demandeId: demande.id, notes: demande.message }
      : EMPTY_ENFANT)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(e: Enfant) {
    setForm({
      prenom: e.prenom, nom: e.nom, dateNaissance: e.dateNaissance ?? '', parentNom: e.parentNom,
      parentContact: e.parentContact, coursId: e.coursId, demandeId: e.demandeId, notes: e.notes ?? '', actif: e.actif,
    })
    setEditId(e.id!)
    setShowForm(true)
  }

  async function saveEnfant() {
    if (!form.prenom.trim() || !form.nom.trim() || !form.parentNom.trim() || !form.parentContact.trim()) return
    try {
      if (editId) {
        await updateEnfant(editId, form)
        showToast('Fiche mise à jour ✓')
      } else {
        await addEnfant(form)
        showToast('Fiche enfant créée ✓')
      }
      setShowForm(false)
      await load()
    } catch { showToast('Erreur', 'err') }
  }

  async function openDetail(e: Enfant) {
    setSelected(e)
    setConsentForm(f => ({ ...f, signataire: e.parentNom }))
    setLoadingConsentements(true)
    try { setConsentements(await getConsentements(e.id!)) }
    catch { setConsentements([]) }
    finally { setLoadingConsentements(false) }
  }

  async function handleAddConsentement() {
    if (!selected?.id || !consentForm.signataire.trim()) return
    try {
      await upsertConsentement({
        enfantId: selected.id, type: consentForm.type, accorde: consentForm.accorde,
        dateSignature: consentForm.date, signataire: consentForm.signataire.trim(),
        notes: consentForm.notes || undefined,
      })
      showToast('Consentement enregistré ✓')
      setConsentements(await getConsentements(selected.id))
      setConsentForm(f => ({ ...f, notes: '' }))
    } catch { showToast('Erreur', 'err') }
  }

  async function toggleActif(e: Enfant) {
    try {
      await updateEnfant(e.id!, { actif: !e.actif })
      showToast(e.actif ? 'Fiche désactivée ✓' : 'Fiche réactivée ✓')
      await load()
      if (selected?.id === e.id) setSelected(s => s ? { ...s, actif: !e.actif } : s)
    } catch { showToast('Erreur', 'err') }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'var(--font-sans)' }}>

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
            Suivi Parent-Enfant
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {enfants.filter(e => e.actif).length} fiche{enfants.length > 1 ? 's' : ''} enfant active{enfants.length > 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => openNew()} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          + Nouvelle fiche
        </button>
      </div>

      <div style={{
        background: 'rgba(21,101,192,.06)', border: '1px solid rgba(21,101,192,.15)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6,
      }}>
        Chaque fiche est créée par le staff à partir d'une inscription réelle (papier ou une
        demande <strong>Démarches pastorales</strong>). Le consentement d'un parent est enregistré
        activité par activité et peut être refusé explicitement. Une fiche n'est jamais supprimée,
        seulement désactivée, pour conserver l'historique des consentements. Voir le document
        « Charte de protection des mineurs » remis à la paroisse pour le cadre associé.
      </div>

      {demandes.filter(d => d.statut !== 'archivee').length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 10 }}>
            Inscriptions catéchisme à traiter ({demandes.filter(d => d.statut !== 'archivee').length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {demandes.filter(d => d.statut !== 'archivee').map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: 10, padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>{d.nom} · {d.contact}</p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{d.message.slice(0, 80)}{d.message.length > 80 ? '…' : ''}</p>
                </div>
                <button onClick={() => openNew(d)} className="btn-outline" style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
                  Créer la fiche →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filtreActif} onChange={e => setFiltreActif(e.target.value as 'actifs' | 'tous')} style={selectStyle}>
          <option value="actifs">Fiches actives</option>
          <option value="tous">Toutes les fiches</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>family_restroom</span>
          <p>Aucune fiche enfant pour ce filtre.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)', textAlign: 'left' }}>
                {['Enfant', 'Parent / tuteur', 'Contact', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid var(--outline-variant)', cursor: 'pointer', opacity: e.actif ? 1 : 0.55 }} onClick={() => openDetail(e)}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>{e.prenom} {e.nom}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>{e.parentNom}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface-variant)' }}>{e.parentContact}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: e.actif ? 'rgba(46,125,50,.12)' : 'rgba(0,0,0,.06)', color: e.actif ? '#2e7d32' : 'var(--on-surface-variant)' }}>
                      {e.actif ? 'Active' : 'Désactivée'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={ev => { ev.stopPropagation(); openEdit(e) }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal création/édition fiche ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 16 }}>
              {editId ? 'Modifier la fiche' : 'Nouvelle fiche enfant'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FField label="Prénom *"><input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} style={inp} /></FField>
              <FField label="Nom *"><input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inp} /></FField>
            </div>
            <FField label="Date de naissance"><input type="date" value={form.dateNaissance ?? ''} onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))} style={inp} /></FField>
            <FField label="Nom du parent / tuteur *"><input value={form.parentNom} onChange={e => setForm(f => ({ ...f, parentNom: e.target.value }))} style={inp} /></FField>
            <FField label="Contact du parent *"><input value={form.parentContact} onChange={e => setForm(f => ({ ...f, parentContact: e.target.value }))} placeholder="Téléphone ou email" style={inp} /></FField>
            <FField label="Notes"><textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} /></FField>
            {editId && (
              <FField label="Statut de la fiche">
                <button onClick={() => setForm(f => ({ ...f, actif: !f.actif }))} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--outline-variant)', background: form.actif ? 'rgba(46,125,50,.08)' : 'rgba(0,0,0,.04)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: form.actif ? '#2e7d32' : 'var(--on-surface-variant)' }}>
                  {form.actif ? 'Active — cliquer pour désactiver' : 'Désactivée — cliquer pour réactiver'}
                </button>
              </FField>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn-primary" onClick={saveEnfant} disabled={!form.prenom.trim() || !form.nom.trim() || !form.parentNom.trim() || !form.parentContact.trim()}>
                {editId ? 'Enregistrer' : 'Créer la fiche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal détail + consentements ── */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)' }}>{selected.prenom} {selected.nom}</h2>
                <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Parent : {selected.parentNom} · {selected.parentContact}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <button onClick={() => toggleActif(selected)} style={{ marginBottom: 20, padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: selected.actif ? 'rgba(46,125,50,.12)' : 'rgba(0,0,0,.06)', color: selected.actif ? '#2e7d32' : 'var(--on-surface-variant)' }}>
              {selected.actif ? 'Active — désactiver' : 'Désactivée — réactiver'}
            </button>

            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 10 }}>Consentements</h3>
            {loadingConsentements ? (
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Chargement…</p>
            ) : consentements.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 12 }}>Aucun consentement enregistré.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {consentements.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-container)', borderRadius: 8, fontSize: 12 }}>
                    <span>{TYPE_CONSENTEMENT_LABELS[c.type]} — {c.signataire}, {new Date(c.dateSignature).toLocaleDateString('fr-FR')}</span>
                    <span style={{ fontWeight: 700, color: c.accorde ? '#2e7d32' : '#c62828' }}>{c.accorde ? 'Accordé' : 'Refusé'}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--surface-container)', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 10 }}>Enregistrer un consentement</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <select value={consentForm.type} onChange={e => setConsentForm(f => ({ ...f, type: e.target.value as TypeConsentement }))} style={selectStyle}>
                  {(Object.entries(TYPE_CONSENTEMENT_LABELS) as [TypeConsentement, string][]).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setConsentForm(f => ({ ...f, accorde: true }))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: consentForm.accorde ? '#2e7d32' : 'white', color: consentForm.accorde ? 'white' : 'var(--on-surface-variant)', fontWeight: 700, fontSize: 12 }}>Accordé</button>
                  <button onClick={() => setConsentForm(f => ({ ...f, accorde: false }))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: !consentForm.accorde ? '#c62828' : 'white', color: !consentForm.accorde ? 'white' : 'var(--on-surface-variant)', fontWeight: 700, fontSize: 12 }}>Refusé</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <input value={consentForm.signataire} onChange={e => setConsentForm(f => ({ ...f, signataire: e.target.value }))} placeholder="Signataire (nom du parent)" style={inp} />
                <input type="date" value={consentForm.date} onChange={e => setConsentForm(f => ({ ...f, date: e.target.value }))} style={inp} />
              </div>
              <input value={consentForm.notes} onChange={e => setConsentForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optionnel)" style={{ ...inp, marginBottom: 10 }} />
              <button className="btn-primary" onClick={handleAddConsentement} disabled={!consentForm.signataire.trim()} style={{ width: '100%' }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--outline-variant)',
  borderRadius: 10, fontSize: 13, outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box', background: 'white',
}

const selectStyle: React.CSSProperties = {
  padding: '10px 12px', border: '1.5px solid var(--outline-variant)',
  borderRadius: 10, fontSize: 13, outline: 'none',
  fontFamily: 'var(--font-sans)', background: 'white', cursor: 'pointer',
}
