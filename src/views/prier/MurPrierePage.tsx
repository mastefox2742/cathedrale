'use client'

import { useEffect, useState } from 'react'
import { Send, Lock } from 'lucide-react'
import { useNavigate } from '../../lib/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { getIntentionsPubliques, deposerIntention, prierPour, type PrayerIntention } from '../../services/prieres'
import { PagePriere } from './PagePriere'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function MurPrierePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [intentions, setIntentions] = useState<PrayerIntention[]>([])
  const [dejaPrie, setDejaPrie] = useState<Set<string>>(new Set())
  const [contenu, setContenu] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [anonyme, setAnonyme] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    getIntentionsPubliques().then(setIntentions).catch(() => setIntentions([]))
  }, [])

  async function prier(i: PrayerIntention) {
    if (dejaPrie.has(i.id)) return
    setDejaPrie(s => new Set(s).add(i.id))
    try {
      const n = await prierPour(i.id)
      setIntentions(list => list.map(x => x.id === i.id ? { ...x, nb_prieres: n } : x))
    } catch { /* compteur indicatif */ }
  }

  async function deposer() {
    if (!user) { navigate('/connexion'); return }
    if (contenu.trim().length < 3) return
    setEnvoi(true)
    setNotice(null)
    try {
      await deposerIntention(user.id, contenu.trim(), isPublic, anonyme)
      setContenu('')
      setNotice('Votre intention a été confiée à la communauté. Que Dieu vous bénisse.')
      getIntentionsPubliques().then(setIntentions).catch(() => {})
    } catch {
      setNotice('Une erreur est survenue. Merci de réessayer.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <PagePriere eyebrow="Communion de prière" titre={<>Mur <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>de prière</em></>}
      intro="Confiez une intention à la communauté, et priez pour celles des autres.">
        <div className="inner" style={{ maxWidth: 820 }}>

          <div className="reveal" style={{ background: 'var(--surface)', border: '1px solid var(--border-accent)', padding: 24, marginBottom: 32 }}>
            <textarea value={contenu} onChange={e => setContenu(e.target.value)} rows={3} maxLength={500}
              placeholder="Écrivez votre intention de prière…" className="dark-input" style={{ width: '100%', resize: 'vertical', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-light)', cursor: 'pointer' }}>
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /> Afficher sur le mur de prière
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-light)', cursor: 'pointer' }}>
                <input type="checkbox" checked={anonyme} onChange={e => setAnonyme(e.target.checked)} /> Anonyme
              </label>
            </div>
            {notice && <p style={{ fontSize: 12, color: 'var(--blue)', marginBottom: 12 }}>{notice}</p>}
            <button onClick={deposer} disabled={envoi || (!!user && contenu.trim().length < 3)} className="btn-gold" style={{ width: '100%', justifyContent: 'center', opacity: envoi ? .6 : 1 }}>
              {user ? <><Send size={14} /> {envoi ? 'Envoi…' : 'Confier mon intention'}</> : <><Lock size={14} /> Se connecter pour déposer une intention</>}
            </button>
          </div>

          {intentions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Aucune intention publique pour le moment.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {intentions.map(i => (
                <div key={i.id} className="reveal" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.7, flex: 1 }}>« {i.contenu} »</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{formatDate(i.created_at)}</span>
                    <button onClick={() => prier(i)} disabled={dejaPrie.has(i.id)} style={{
                      padding: '5px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700, cursor: dejaPrie.has(i.id) ? 'default' : 'pointer',
                      border: '1.5px solid var(--border-accent)',
                      background: dejaPrie.has(i.id) ? 'var(--primary)' : 'transparent',
                      color: dejaPrie.has(i.id) ? '#fff' : 'var(--primary)',
                    }}>
                      🙏 {dejaPrie.has(i.id) ? 'Je prie' : 'Je prie pour'}{i.nb_prieres ? ` · ${i.nb_prieres}` : ''}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </PagePriere>
  )
}
