import { useEffect, useState } from 'react'
import {
  enregistrerDon, formatXAF, getProjetsDons,
  MOBILE_MONEY_CONFIG, MONTANTS_SUGGERES, TYPE_DON_LABELS,
  type MethodePaiement, type TypeDon, type ProjetDon,
} from '../services/dons'

export function DonsPage() {
  const [typeDon, setTypeDon] = useState<TypeDon>('libre')
  const [methode, setMethode] = useState<MethodePaiement>('mtn')
  const [montant, setMontant] = useState<number | ''>('')
  const [intention, setIntention] = useState('')
  const [projetId, setProjetId] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'form' | 'instructions' | 'confirmation'>('form')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [projets, setProjets] = useState<ProjetDon[]>([])
  const [loadingProjets, setLoadingProjets] = useState(true)

  useEffect(() => {
    getProjetsDons().then(setProjets).catch(() => setProjets([])).finally(() => setLoadingProjets(false))
  }, [])

  const montantNum = typeof montant === 'number' ? montant : 0

  async function handleDon() {
    if (!montantNum || montantNum < 100) return
    setLoading(true)
    try {
      const ref = await enregistrerDon({
        montant: montantNum,
        devise: 'XAF',
        methode,
        type: typeDon,
        intention: intention || undefined,
        projetId: projetId || undefined,
        nomDonateur: nom || undefined,
        emailDonateur: email || undefined,
      })
      setReference(ref)
      setStep(methode === 'virement' ? 'confirmation' : 'instructions')
    } finally { setLoading(false) }
  }

  if (step === 'instructions') {
    const cfg = MOBILE_MONEY_CONFIG[methode as 'mtn' | 'airtel']
    return (
      <div className="page-hero" style={{ paddingBottom: 0 }}>
        <div className="inner" style={{ position: 'relative', zIndex: 2, paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 24, color: 'var(--primary)', marginBottom: 4 }}>
              Instructions de paiement
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24 }}>Référence : <strong>{reference}</strong></p>

            <div style={{
              background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`,
              border: `2px solid ${cfg.color}`,
              borderRadius: 'var(--r-md)', padding: 20, marginBottom: 20, textAlign: 'left',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
                {cfg.logo} Envoyez <strong style={{ color: cfg.color, fontSize: 18 }}>{formatXAF(montantNum)}</strong> via {cfg.label}
              </p>
              {[
                { num: '1', texte: 'Composez *126# (MTN) ou *555# (Airtel) sur votre téléphone' },
                { num: '2', texte: 'Choisissez "Envoi d\'argent" → "Envoi vers numéro"' },
                { num: '3', texte: `Entrez le numéro : ${cfg.numero}` },
                { num: '4', texte: `Montant : ${formatXAF(montantNum)}` },
                { num: '5', texte: `Dans le motif, indiquez votre référence : ${reference}` },
                { num: '6', texte: 'Confirmez avec votre code PIN' },
              ].map(s => (
                <div key={s.num} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: cfg.color, color: cfg.textColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>{s.num}</div>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, paddingTop: 3 }}>{s.texte}</p>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(56,142,60,.08)', border: '1px solid rgba(56,142,60,.3)',
              borderRadius: 'var(--r-md)', padding: '14px', marginBottom: 20, textAlign: 'left',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#388E3C', marginBottom: 4 }}>
                ✓ Votre don a été enregistré
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                Après confirmation du paiement, votre don sera comptabilisé. Conservez votre référence <strong>{reference}</strong>.
              </p>
            </div>

            {email && (
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
                📧 Un récapitulatif sera envoyé à {email}
              </p>
            )}

            <button
              onClick={() => { setStep('form'); setMontant(''); setReference('') }}
              className="btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Faire un autre don
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-hero" style={{ textAlign: 'center' }}>
        <div className="page-hero-content" style={{ textAlign: 'center', maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <p className="page-hero-eyebrow" style={{ justifyContent: 'center' }}>Générosité &amp; Solidarité</p>
          <h1>Faire un Don<br /><em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>pour l'œuvre de Dieu</em></h1>
          <p style={{ marginTop: 16, fontSize: 15, color: 'var(--text-mid)', fontWeight: 300, maxWidth: 500, margin: '16px auto 0', lineHeight: 1.8 }}>
            Vos dons soutiennent l'entretien de notre cathédrale, nos missions et l'aide aux plus démunis de Brazzaville.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner">

          {/* ── Projets en cours ── */}
          <div className="reveal" style={{ marginBottom: 40 }}>
            <span className="section-label">Projets en cours</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'var(--space-xl)' }}>
            {loadingProjets ? (
              <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Chargement…</p>
            ) : projets.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Aucun projet en cours pour le moment.</p>
            ) : projets.map(p => {
              const pct = Math.round((p.collecte / p.objectif) * 100)
              return (
                <button
                  key={p.id}
                  onClick={() => { setProjetId(projetId === p.id ? '' : p.id!); setTypeDon('projet') }}
                  className="reveal"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                    padding: '20px 24px', background: 'var(--surface)', cursor: 'pointer',
                    border: `1px solid ${projetId === p.id ? 'var(--gold)' : 'rgba(193,164,97,.1)'}`,
                  }}
                >
                  <span style={{ fontSize: 26 }}>{p.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{p.titre}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{formatXAF(p.collecte)} / {formatXAF(p.objectif)}</p>
                    <div style={{ background: 'rgba(0,0,0,.06)', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 8 }}>
                      <div style={{ height: '100%', borderRadius: 4, background: pct >= 80 ? '#388E3C' : 'var(--blue)', width: `${Math.min(pct, 100)}%`, transition: 'width .6s ease' }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 700, color: pct >= 80 ? '#388E3C' : 'var(--blue)' }}>{pct}%</span>
                </button>
              )
            })}
          </div>

          {/* ── Sélecteur montant + type ── */}
          <div className="reveal" style={{ maxWidth: 640, margin: '0 auto var(--space-xl)' }}>
            <p style={{ textAlign: 'center', marginBottom: 20 }}>
              <span className="section-label" style={{ justifyContent: 'center' }}>Type de don</span>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
              {(Object.entries(TYPE_DON_LABELS) as [TypeDon, typeof TYPE_DON_LABELS[TypeDon]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setTypeDon(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', border: `1px solid ${typeDon === key ? 'var(--gold)' : 'rgba(193,164,97,.2)'}`,
                    background: typeDon === key ? 'var(--gold)' : 'none',
                    color: typeDon === key ? 'var(--black)' : 'var(--grey)',
                    fontFamily: 'var(--v2-font-sans)', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .2s',
                  }}
                >
                  <span>{cfg.icon}</span> {cfg.label}
                </button>
              ))}
            </div>

            {typeDon === 'messe' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>
                  Intention de la messe
                </label>
                <input
                  value={intention}
                  onChange={e => setIntention(e.target.value)}
                  placeholder="Ex : Pour la guérison de Jean-Pierre…"
                  className="dark-input"
                />
              </div>
            )}

            <p style={{ textAlign: 'center', marginBottom: 24 }}>
              <span className="section-label" style={{ justifyContent: 'center' }}>Choisir un montant</span>
            </p>
            <div className="montants-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(193,164,97,.1)', marginBottom: 8 }}>
              {MONTANTS_SUGGERES.map(m => (
                <button key={m} onClick={() => setMontant(m)} style={{
                  background: montant === m ? 'var(--gold)' : 'var(--anthracite)',
                  border: 'none', cursor: 'pointer', padding: '22px 8px', textAlign: 'center',
                  fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 700,
                  color: montant === m ? 'var(--black)' : 'var(--white)',
                  transition: 'all .2s',
                }}>
                  {m.toLocaleString('fr-FR')}
                  <span style={{ display: 'block', fontFamily: 'var(--v2-font-sans)', fontSize: 9, fontWeight: 400, opacity: .7, marginTop: 2 }}>FCFA</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border-accent)', marginBottom: 28 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-light)', flexShrink: 0 }}>Montant libre</label>
              <input
                type="number" min="100" value={montant === '' ? '' : montant} placeholder="Entrez un montant"
                onChange={e => setMontant(e.target.value ? Number(e.target.value) : '')}
                className="dark-input" style={{ flex: 1, border: 'none', padding: '8px 4px', fontSize: 18, fontFamily: 'var(--v2-font-serif)', fontWeight: 700 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', flexShrink: 0 }}>FCFA</span>
            </div>

            {/* ── Méthode de paiement ── */}
            <p style={{ textAlign: 'center', marginBottom: 20 }}>
              <span className="section-label" style={{ justifyContent: 'center' }}>Méthode de paiement</span>
            </p>
            <div className="canaux-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {([
                { key: 'mtn',      label: 'MTN Mobile Money', logo: '🟡', color: '#FFCC00', text: '#333' },
                { key: 'airtel',   label: 'Airtel Money',      logo: '🔴', color: '#E40000', text: '#fff' },
                { key: 'carte',    label: 'Carte bancaire',    logo: '💳', color: '#1565C0', text: '#fff' },
                { key: 'virement', label: 'Virement bancaire', logo: '🏦', color: '#37474f', text: '#fff' },
              ] as const).map(m => (
                <button
                  key={m.key}
                  onClick={() => setMethode(m.key)}
                  style={{
                    padding: '14px', border: 'none', cursor: 'pointer',
                    background: methode === m.key ? m.color : 'var(--anthracite)',
                    color: methode === m.key ? m.text : 'var(--white)',
                    transition: 'all .2s', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{m.logo}</div>
                  <p style={{ fontSize: 11, fontWeight: 700 }}>{m.label}</p>
                </button>
              ))}
            </div>

            {methode === 'carte' && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(21,101,192,.08)', border: '1px solid rgba(21,101,192,.2)' }}>
                <p style={{ fontSize: 13, color: '#1565C0', fontWeight: 700 }}>💳 Paiement par carte — Bientôt disponible</p>
                <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                  Intégration CinetPay en cours de configuration. Utilisez Mobile Money en attendant.
                </p>
              </div>
            )}

            {methode === 'virement' && (
              <div style={{ marginBottom: 20, padding: '16px', background: 'var(--bg-alt)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>🏦 Coordonnées bancaires</p>
                {[
                  { l: 'Banque', v: 'BGFI Bank Congo' },
                  { l: 'Titulaire', v: 'Archidiocèse de Brazzaville' },
                  { l: 'IBAN', v: 'CG00 BGFI XXXX XXXX XXXX XXXX XXX' },
                  { l: 'BIC/SWIFT', v: 'BGFICGCG' },
                  { l: 'Motif', v: 'Don Cathédrale Sacré-Cœur' },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(193,164,97,.1)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Coordonnées + confirmation ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom (facultatif)" className="dark-input" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email pour le reçu (facultatif)" className="dark-input" />
            </div>

            <button
              onClick={handleDon}
              disabled={loading || !montantNum || montantNum < 100 || methode === 'carte'}
              className="btn-gold"
              style={{ width: '100%', justifyContent: 'center', opacity: (loading || !montantNum || montantNum < 100 || methode === 'carte') ? .5 : 1, cursor: (loading || !montantNum || methode === 'carte') ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Enregistrement…' : montantNum ? `✦ Donner ${formatXAF(montantNum)}` : 'Choisir un montant'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-light)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              Votre générosité contribue à la vie de la cathédrale et à ses œuvres sociales. Que Dieu vous bénisse. 🙏
            </p>
          </div>

          {/* ── Affectation / transparence ── */}
          <div className="reveal" style={{ marginBottom: 32 }}>
            <span className="section-label">Transparence</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 700, color: 'var(--text)' }}>
              À quoi servent <em style={{ color: 'var(--blue)', fontStyle: 'italic' }}>vos dons ?</em>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'var(--space-xl)' }}>
            {projets.length === 0 ? null : projets.map((p, i) => {
              const pct = Math.min(100, Math.round((p.collecte / p.objectif) * 100))
              return (
                <div key={p.id} className="reveal" style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', alignItems: 'stretch', background: 'var(--surface)', border: `1px solid ${i === 0 ? 'rgba(193,164,97,.2)' : 'rgba(193,164,97,.07)'}` }}>
                  <div style={{ background: i === 0 ? 'var(--gold)' : 'var(--gold-dark)' }} />
                  <div style={{ padding: '24px 28px' }}>
                    <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{p.emoji} {p.titre}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300, lineHeight: 1.7 }}>{p.description}</p>
                  </div>
                  <div style={{ padding: '24px 28px', borderLeft: '1px solid rgba(193,164,97,.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 90 }}>
                    <strong style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--blue)' }}>{pct}%</strong>
                    <span style={{ fontSize: 10, color: 'var(--text-light)', textAlign: 'center', marginTop: 2 }}>collecté</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="verse-band reveal" style={{ marginBottom: 0 }}>
            <blockquote>
              « Donnez et il vous sera donné. C'est une bonne mesure, tassée, secouée, débordante, qu'on versera dans le pan de votre vêtement. »
              <cite className="verse-ref">— Luc 6, 38</cite>
            </blockquote>
          </div>

        </div>
      </div>
    </>
  )
}
