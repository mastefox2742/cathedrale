import { useEffect, useState } from 'react'
import { useDroits } from '../../contexts/AuthContext'
import { canManageDons } from '../../services/auth'
import {
  getDons, updateStatutDon, formatXAF, getProjetsDons, TYPE_DON_LABELS, STATUT_DON_LABELS, METHODE_LABELS,
  type Don, type ProjetDon,
} from '../../services/dons'
import { telechargerCsv } from '../../services/stats'
import { PageAdmin, Chargement, Vide, Pastille, inp, useToast, thStyle, tdStyle } from '../../components/admin/ui'

type Statut = Don['statut']

export function AdminDonsPage() {
  const droits = useDroits()
  const toast = useToast()
  const [dons, setDons] = useState<Don[]>([])
  const [projets, setProjets] = useState<ProjetDon[]>([])
  const [loading, setLoading] = useState(true)
  const [statut, setStatut] = useState<Statut | ''>('')
  const [depuis, setDepuis] = useState('')
  const [jusqua, setJusqua] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [d, p] = await Promise.all([getDons(), getProjetsDons(false).catch(() => [])])
      setDons(d); setProjets(p)
    } catch { toast.show('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (canManageDons(droits.roles)) load(); else setLoading(false) }, [])

  if (!canManageDons(droits.roles)) {
    return <PageAdmin titre="Dons reçus"><Vide icone="lock" texte="Réservé à la trésorerie et à l'administration de la paroisse." /></PageAdmin>
  }

  async function changer(d: Don, s: Statut) {
    try { await updateStatutDon(d.id!, s); toast.show('Statut mis à jour ✓'); await load() }
    catch { toast.show('Erreur', 'err') }
  }

  const nomProjet = new Map(projets.map(p => [p.id, p.titre]))
  const visibles = dons.filter(d => {
    if (statut && d.statut !== statut) return false
    const jour = d.createdAt?.slice(0, 10) ?? ''
    if (depuis && jour < depuis) return false
    if (jusqua && jour > jusqua) return false
    return true
  })
  const totalConfirme = visibles.filter(d => d.statut === 'confirme').reduce((s, d) => s + Number(d.montant), 0)
  const totalAttente = visibles.filter(d => d.statut === 'en_attente').reduce((s, d) => s + Number(d.montant), 0)

  function exporter() {
    telechargerCsv(`dons-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Date', 'Référence', 'Montant (XAF)', 'Méthode', 'Type', 'Projet', 'Intention', 'Donateur', 'Email', 'Statut'],
      visibles.map(d => [
        d.createdAt ? new Date(d.createdAt).toLocaleString('fr-FR') : '', d.reference, d.montant, METHODE_LABELS[d.methode],
        TYPE_DON_LABELS[d.type].label, d.projetId ? nomProjet.get(d.projetId) ?? d.projetId : '', d.intention,
        d.nomDonateur, d.emailDonateur, STATUT_DON_LABELS[d.statut],
      ]))
  }

  return (
    <PageAdmin
      titre="Dons reçus"
      sousTitre="Rapprochez chaque don avec votre relevé Mobile Money ou bancaire, puis confirmez-le"
      action={<button className="btn-primary" onClick={exporter} disabled={visibles.length === 0} style={{ gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>Exporter (CSV)
      </button>}
    >
      {toast.node}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Confirmés', value: formatXAF(totalConfirme), color: '#2e7d32' },
          { label: 'En attente de vérification', value: formatXAF(totalAttente), color: '#e65100' },
          { label: 'Nombre de dons', value: String(visibles.length), color: 'var(--primary)' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4 }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <select value={statut} onChange={e => setStatut(e.target.value as Statut | '')} style={{ ...inp, width: 200 }} aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          {(Object.keys(STATUT_DON_LABELS) as Statut[]).map(s => <option key={s} value={s}>{STATUT_DON_LABELS[s]}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>Du <input type="date" value={depuis} onChange={e => setDepuis(e.target.value)} style={{ ...inp, width: 160 }} /></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>au <input type="date" value={jusqua} onChange={e => setJusqua(e.target.value)} style={{ ...inp, width: 160 }} /></label>
      </div>

      {loading ? <Chargement /> : visibles.length === 0 ? <Vide icone="payments" texte="Aucun don pour ces critères." /> : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 860, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)' }}>
                {['Date', 'Référence', 'Montant', 'Méthode', 'Type', 'Donateur', 'Statut'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibles.map(d => (
                <tr key={d.id}>
                  <td style={tdStyle}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : ''}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{d.reference}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{formatXAF(d.montant)}</td>
                  <td style={tdStyle}>{METHODE_LABELS[d.methode]}</td>
                  <td style={tdStyle}>
                    {TYPE_DON_LABELS[d.type].label}
                    {d.projetId && <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{nomProjet.get(d.projetId) ?? ''}</div>}
                    {d.intention && <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>« {d.intention} »</div>}
                  </td>
                  <td style={tdStyle}>{d.nomDonateur || 'Anonyme'}{d.emailDonateur && <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{d.emailDonateur}</div>}</td>
                  <td style={tdStyle}>
                    <select value={d.statut} onChange={e => changer(d, e.target.value as Statut)} style={{ ...inp, padding: '6px 10px', fontSize: 13, width: 140 }} aria-label="Statut du don">
                      {(Object.keys(STATUT_DON_LABELS) as Statut[]).map(s => <option key={s} value={s}>{STATUT_DON_LABELS[s]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 16 }}>
        <Pastille texte="Paiement carte (CinetPay)" ton="gris" /> bientôt disponible : les dons en ligne passeront alors automatiquement en « Confirmé ».
      </p>
    </PageAdmin>
  )
}
