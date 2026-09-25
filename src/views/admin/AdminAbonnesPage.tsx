'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { getAbonnements, type Abonnement } from '../../services/abonnements'
import { logAudit } from '../../services/auditLog'
import { telechargerCsv } from '../../services/stats'
import { PageAdmin, Chargement, Vide, Pastille, IconBtn, ConfirmationSuppression, useToast, thStyle, tdStyle } from '../../components/admin/ui'

export function AdminAbonnesPage() {
  const toast = useToast()
  const [abonnes, setAbonnes] = useState<Abonnement[]>([])
  const [loading, setLoading] = useState(true)
  const [canal, setCanal] = useState<'' | 'email' | 'whatsapp'>('')
  const [suppr, setSuppr] = useState<Abonnement | null>(null)

  async function load() {
    setLoading(true)
    try { setAbonnes(await getAbonnements()) }
    catch { toast.show('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function supprimer(a: Abonnement) {
    try {
      const { error } = await supabase.from('abonnements').delete().eq('id', a.id!)
      if (error) throw error
      await logAudit('delete', 'abonne', a.id!, a.canal)
      toast.show('Abonné retiré')
      setSuppr(null)
      await load()
    } catch { toast.show('Erreur', 'err') }
  }

  const visibles = canal ? abonnes.filter(a => a.canal === canal) : abonnes
  const prefsTexte = (a: Abonnement) => Object.entries(a.prefs ?? {}).filter(([, v]) => v).map(([k]) => k).join(', ')

  return (
    <PageAdmin
      titre="Abonnés"
      sousTitre={`${abonnes.length} abonné${abonnes.length > 1 ? 's' : ''} aux actualités (email et WhatsApp)`}
      action={<button className="btn-primary" disabled={visibles.length === 0} style={{ gap: 8 }}
        onClick={() => telechargerCsv(`abonnes-${new Date().toISOString().slice(0, 10)}.csv`, ['Canal', 'Contact', 'Centres d\'intérêt', 'Confirmé', 'Inscrit le'],
          visibles.map(a => [a.canal, a.contact, prefsTexte(a), a.confirme ? 'oui' : 'non', a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : '']))}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>Exporter (CSV)
      </button>}
    >
      {toast.node}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['', 'email', 'whatsapp'] as const).map(c => (
          <button key={c} onClick={() => setCanal(c)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: canal === c ? 'var(--primary)' : 'var(--surface-container)', color: canal === c ? 'white' : 'var(--on-surface-variant)',
          }}>{c === '' ? 'Tous' : c === 'email' ? 'Email' : 'WhatsApp'}</button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
        L'envoi automatique n'est pas encore branché : exportez la liste pour vos envois (liste de diffusion WhatsApp, logiciel d'emailing).
      </p>
      {loading ? <Chargement /> : visibles.length === 0 ? <Vide icone="mark_email_read" texte="Aucun abonné." /> : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--surface-container)' }}>{['Canal', 'Contact', "Centres d'intérêt", 'Inscrit le', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {visibles.map(a => (
                <tr key={a.id}>
                  <td style={tdStyle}><Pastille texte={a.canal === 'email' ? 'Email' : 'WhatsApp'} ton={a.canal === 'email' ? 'bleu' : 'vert'} /></td>
                  <td style={tdStyle}>{a.contact}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--on-surface-variant)' }}>{prefsTexte(a) || '—'}</td>
                  <td style={tdStyle}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : ''}</td>
                  <td style={tdStyle}><IconBtn icone="delete" titre="Retirer" ton="danger" onClick={() => setSuppr(a)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {suppr && <ConfirmationSuppression texte={`${suppr.contact} ne recevra plus les actualités.`} onAnnuler={() => setSuppr(null)} onConfirmer={() => supprimer(suppr)} />}
    </PageAdmin>
  )
}
