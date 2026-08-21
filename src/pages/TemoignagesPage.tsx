import { useEffect, useState } from 'react'
import { getTemoignagesApprouves, deposerTemoignage, type Temoignage } from '../services/temoignages'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function TemoignagesPage() {
  const [temoignages, setTemoignages] = useState<Temoignage[]>([])
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [contenu, setContenu] = useState('')
  const [anonyme, setAnonyme] = useState(false)
  const [societe, setSociete] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getTemoignagesApprouves().then(setTemoignages).catch(() => setTemoignages([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSubmit() {
    if (societe) return
    if (contenu.trim().length < 10) { setNotice('Écrivez au moins quelques mots (10 caractères minimum).'); return }
    setSubmitting(true)
    setNotice(null)
    try {
      await deposerTemoignage(contenu.trim(), anonyme ? undefined : (nom.trim() || undefined))
      setContenu(''); setNom(''); setAnonyme(false)
      setNotice('Merci ! Votre témoignage sera publié après vérification par l\'équipe pastorale.')
    } catch {
      setNotice('Une erreur est survenue. Merci de réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Vie de la communauté</p>
          <h1>Témoignages <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>de foi</em></h1>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner" style={{ maxWidth: 720 }}>

          <div className="reveal" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-accent)', borderRadius: 'var(--r-md)', padding: 28, marginBottom: 48 }}>
            <span className="section-label">Partager mon témoignage</span>
            <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.8, margin: '10px 0 20px' }}>
              Une grâce reçue, un moment de conversion, une prière exaucée… Partagez ce que Dieu a fait dans votre vie.
              Votre témoignage sera relu par l'équipe pastorale avant publication.
            </p>

            <textarea
              value={contenu} onChange={e => setContenu(e.target.value)} rows={5}
              placeholder="Écrivez votre témoignage…" className="dark-input" style={{ width: '100%', resize: 'vertical', marginBottom: 14 }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-light)', marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={anonyme} onChange={e => setAnonyme(e.target.checked)} />
              Publier anonymement
            </label>

            {!anonyme && (
              <input
                value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom (facultatif)"
                className="dark-input" style={{ width: '100%', marginBottom: 14 }}
              />
            )}

            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="societe-temoignage">Ne pas remplir</label>
              <input id="societe-temoignage" tabIndex={-1} autoComplete="off" value={societe} onChange={e => setSociete(e.target.value)} />
            </div>

            {notice && <p style={{ fontSize: 12, color: 'var(--blue)', marginBottom: 14 }}>{notice}</p>}

            <button
              onClick={handleSubmit} disabled={submitting || contenu.trim().length < 10}
              className="btn-gold" style={{ width: '100%', justifyContent: 'center', opacity: (submitting || contenu.trim().length < 10) ? .6 : 1 }}
            >
              {submitting ? 'Envoi…' : 'Envoyer mon témoignage'}
            </button>
          </div>

          <div className="reveal" style={{ marginBottom: 28 }}>
            <span className="section-label">Témoignages publiés</span>
          </div>

          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Chargement…</p>
          ) : temoignages.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Aucun témoignage publié pour le moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {temoignages.map(t => (
                <div key={t.id} className="reveal" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px 28px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{t.contenu}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 12, fontWeight: 600 }}>
                    — {t.auteurNom || 'Anonyme'} · {t.createdAt ? formatDate(t.createdAt) : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
