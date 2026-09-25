import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDroits } from '../../contexts/AuthContext'
import { canViewRegistre, ROLE_LABELS } from '../../services/auth'
import { getRegistreStaff, telechargerCsv, type LigneRegistre } from '../../services/stats'
import { PageAdmin, Chargement, Vide, Pastille, useToast, thStyle, tdStyle } from '../../components/admin/ui'

/** Registre des catéchistes et encadrants : habilitation et formations obligatoires. */
export function AdminRegistrePage() {
  const droits = useDroits()
  const toast = useToast()
  const [lignes, setLignes] = useState<LigneRegistre[]>([])
  const [loading, setLoading] = useState(true)
  const [aSuivre, setASuivre] = useState(false)
  const autorise = canViewRegistre(droits.roles)

  useEffect(() => {
    if (!autorise) { setLoading(false); return }
    getRegistreStaff().then(setLignes).catch(() => toast.show('Erreur de chargement', 'err')).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorise])

  if (!autorise) {
    return <PageAdmin titre="Registre du staff"><Vide icone="lock" texte="Réservé aux responsables de la catéchèse, de la protection des mineurs et de l'administration." /></PageAdmin>
  }

  const enRegle = (l: LigneRegistre) => l.formations_terminees >= l.formations_requises
  const visibles = aSuivre ? lignes.filter(l => !enRegle(l) || !l.verifie_securite) : lignes
  const nbOk = lignes.filter(l => enRegle(l) && l.verifie_securite).length

  return (
    <PageAdmin
      titre="Registre du staff"
      sousTitre={`${nbOk}/${lignes.length} personne${lignes.length > 1 ? 's' : ''} en règle (habilitation vérifiée et formations obligatoires suivies)`}
      action={<button className="btn-primary" disabled={visibles.length === 0} style={{ gap: 8 }}
        onClick={() => telechargerCsv(`registre-staff-${new Date().toISOString().slice(0, 10)}.csv`,
          ['Nom', 'Email', 'Paroisse', 'Rôle', 'Habilitation vérifiée', 'Formations suivies', 'Formations requises'],
          visibles.map(l => [l.nom, l.email, l.parish_nom, ROLE_LABELS[l.role], l.verifie_securite ? 'oui' : 'non', l.formations_terminees, l.formations_requises]))}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>Exporter (CSV)
      </button>}
    >
      {toast.node}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16, cursor: 'pointer' }}>
        <input type="checkbox" checked={aSuivre} onChange={e => setASuivre(e.target.checked)} /> Afficher uniquement les personnes à régulariser
      </label>
      <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
        Les formations obligatoires se créent dans <Link to="/admin/parcours" style={{ color: 'var(--primary)' }}>Parcours de foi</Link> (type « Formation du staff »). L'habilitation se coche dans Utilisateurs & Rôles.
      </p>
      {loading ? <Chargement /> : visibles.length === 0 ? <Vide icone="verified_user" texte="Personne à afficher." /> : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--surface-container)' }}>{['Nom', 'Paroisse', 'Rôle', 'Habilitation', 'Formations'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {visibles.map(l => (
                <tr key={`${l.user_id}-${l.parish_nom}-${l.role}`}>
                  <td style={tdStyle}>{l.nom || '—'}<div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{l.email}</div></td>
                  <td style={tdStyle}>{l.parish_nom}</td>
                  <td style={tdStyle}>{ROLE_LABELS[l.role]}</td>
                  <td style={tdStyle}><Pastille texte={l.verifie_securite ? '✓ Vérifiée' : 'À vérifier'} ton={l.verifie_securite ? 'vert' : 'orange'} /></td>
                  <td style={tdStyle}>
                    {l.formations_requises === 0 ? <Pastille texte="Aucune requise" ton="gris" /> :
                      <Pastille texte={`${l.formations_terminees}/${l.formations_requises}`} ton={enRegle(l) ? 'vert' : 'orange'} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageAdmin>
  )
}
