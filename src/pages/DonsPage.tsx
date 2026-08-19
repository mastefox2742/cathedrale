import { useState } from 'react'
import {
  enregistrerDon, formatXAF,
  MOBILE_MONEY_CONFIG, MONTANTS_SUGGERES, TYPE_DON_LABELS,
  type MethodePaiement, type TypeDon,
} from '../services/dons'

const PROJETS = [
  { id: 'renovation', titre: 'Rénovation de la cathédrale', objectif: 50_000_000, collecte: 32_500_000, emoji: '🏛️' },
  { id: 'bourses',    titre: 'Bourses catéchèse',           objectif: 5_000_000,  collecte: 2_100_000,  emoji: '📚' },
  { id: 'orgue',      titre: 'Restauration de l\'orgue',    objectif: 15_000_000, collecte: 4_800_000,  emoji: '🎵' },
]

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 4, background: color,
        width: `${Math.min(pct, 100)}%`, transition: 'width 0.8s ease',
      }} />
    </div>
  )
}

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
  const [showVirement, setShowVirement] = useState(false)

  const montantNum = typeof montant === 'number' ? montant : 0
  const mmConfig = MOBILE_MONEY_CONFIG[methode as 'mtn' | 'airtel']

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
      <div style={{ padding: '24px var(--margin) var(--space-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>📱</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 4 }}>
            Instructions de paiement
          </h2>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Référence : <strong>{reference}</strong></p>
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`,
          border: `2px solid ${cfg.color}`,
          borderRadius: 16, padding: 20, marginBottom: 20,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--on-surface)' }}>
            {cfg.logo} Envoyez <strong style={{ color: cfg.color, fontSize: 18 }}>{formatXAF(montantNum)}</strong> via {cfg.label}
          </p>
          {[
            { num: '1', texte: `Composez *126# (MTN) ou *555# (Airtel) sur votre téléphone` },
            { num: '2', texte: `Choisissez "Envoi d'argent" → "Envoi vers numéro"` },
            { num: '3', texte: `Entrez le numéro : ${cfg.numero}` },
            { num: '4', texte: `Montant : ${formatXAF(montantNum)}` },
            { num: '5', texte: `Dans le motif, indiquez votre référence : ${reference}` },
            { num: '6', texte: `Confirmez avec votre code PIN` },
          ].map(s => (
            <div key={s.num} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: cfg.color, color: cfg.textColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>{s.num}</div>
              <p style={{ fontSize: 14, color: 'var(--on-surface)', lineHeight: 1.5, paddingTop: 4 }}>{s.texte}</p>
            </div>
          ))}
        </div>

        <div style={{
          background: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.3)',
          borderRadius: 12, padding: '14px', marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32', marginBottom: 4 }}>
            ✓ Votre don a été enregistré
          </p>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
            Après confirmation du paiement, votre don sera comptabilisé. Conservez votre référence <strong>{reference}</strong>.
          </p>
        </div>

        {email && (
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', textAlign: 'center', marginBottom: 16 }}>
            📧 Un récapitulatif sera envoyé à {email}
          </p>
        )}

        <button
          onClick={() => { setStep('form'); setMontant(''); setReference('') }}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid var(--primary)',
            background: 'white', color: 'var(--primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Faire un autre don
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 var(--margin) var(--space-lg)' }}>

      {/* Header */}
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>Don & Offrande</h1>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
          Soutenez la vie et les projets de votre cathédrale
        </p>
      </div>

      {/* Projets en cours */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Projets en cours
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PROJETS.map(p => {
            const pct = Math.round((p.collecte / p.objectif) * 100)
            return (
              <div key={p.id} style={{
                background: 'white', borderRadius: 14, padding: '14px',
                boxShadow: '0 2px 8px rgba(0,35,111,0.07)',
                border: projetId === p.id ? '2px solid var(--primary)' : '1px solid rgba(0,35,111,0.08)',
                cursor: 'pointer',
              }}
                onClick={() => { setProjetId(projetId === p.id ? '' : p.id); setTypeDon('projet') }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{p.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)' }}>{p.titre}</p>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{formatXAF(p.collecte)} / {formatXAF(p.objectif)}</p>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: pct >= 80 ? '#2e7d32' : 'var(--primary)',
                    background: pct >= 80 ? 'rgba(46,125,50,0.1)' : 'rgba(0,35,111,0.08)',
                    padding: '4px 10px', borderRadius: 20,
                  }}>{pct}%</span>
                </div>
                <ProgressBar pct={pct} color={pct >= 80 ? '#2e7d32' : 'var(--primary)'} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Type de don */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Type de don
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.entries(TYPE_DON_LABELS) as [TypeDon, typeof TYPE_DON_LABELS[TypeDon]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setTypeDon(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: typeDon === key ? 'var(--primary)' : 'var(--surface-container)',
                color: typeDon === key ? 'white' : 'var(--on-surface-variant)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              <span>{cfg.icon}</span> {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intention de messe */}
      {typeDon === 'messe' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', display: 'block', marginBottom: 6 }}>
            Intention de la messe
          </label>
          <input
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="Ex: Pour la guérison de Jean-Pierre..."
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14,
              border: '1.5px solid rgba(0,35,111,0.15)', fontFamily: 'var(--font-sans)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Montant */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Montant (FCFA)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {MONTANTS_SUGGERES.map(m => (
            <button
              key={m}
              onClick={() => setMontant(m)}
              style={{
                padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: montant === m ? 'var(--primary)' : 'var(--surface-container)',
                color: montant === m ? 'white' : 'var(--on-surface)',
                fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              {formatXAF(m)}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={montant}
          onChange={e => setMontant(e.target.value ? Number(e.target.value) : '')}
          placeholder="Ou saisir un montant libre..."
          min={100}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 18, fontWeight: 700,
            border: '2px solid rgba(0,35,111,0.2)', fontFamily: 'var(--font-serif)',
            outline: 'none', boxSizing: 'border-box', textAlign: 'center',
            color: montantNum > 0 ? 'var(--primary)' : 'var(--on-surface-variant)',
          }}
        />
        {montantNum > 0 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>
            {formatXAF(montantNum)}
          </p>
        )}
      </div>

      {/* Méthode de paiement */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Méthode de paiement
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: methode === m.key ? m.color : 'var(--surface-container)',
                color: methode === m.key ? m.text : 'var(--on-surface)',
                transition: 'all 0.2s', textAlign: 'center',
                boxShadow: methode === m.key ? `0 4px 12px ${m.color}55` : 'none',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{m.logo}</div>
              <p style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</p>
            </button>
          ))}
        </div>

        {methode === 'carte' && (
          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.2)' }}>
            <p style={{ fontSize: 13, color: '#1565C0', fontWeight: 600 }}>💳 Paiement par carte — Bientôt disponible</p>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
              Intégration CinetPay en cours de configuration. Utilisez Mobile Money en attendant.
            </p>
          </div>
        )}

        {methode === 'virement' && (
          <div style={{ marginTop: 12, padding: '14px', borderRadius: 10, background: 'var(--surface-container)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>🏦 Coordonnées bancaires</p>
            {[
              { l: 'Banque', v: 'BGFI Bank Congo' },
              { l: 'Titulaire', v: 'Archidiocèse de Brazzaville' },
              { l: 'IBAN', v: 'CG00 BGFI XXXX XXXX XXXX XXXX XXX' },
              { l: 'BIC/SWIFT', v: 'BGFICGCG' },
              { l: 'Motif', v: 'Don Cathédrale Sacré-Cœur' },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,35,111,0.06)' }}>
                <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{r.l}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations optionnelles */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 10 }}>
          Informations optionnelles (pour le reçu)
        </p>
        <input
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Votre nom"
          style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, border: '1.5px solid rgba(0,35,111,0.12)', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email pour recevoir le reçu"
          style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, border: '1.5px solid rgba(0,35,111,0.12)', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Bouton */}
      <button
        onClick={handleDon}
        disabled={loading || !montantNum || montantNum < 100 || methode === 'carte'}
        style={{
          width: '100%', padding: '15px', borderRadius: 14, border: 'none',
          background: methode === 'mtn' ? '#FFCC00' : methode === 'airtel' ? '#E40000' : methode === 'virement' ? '#37474f' : 'var(--surface-container)',
          color: methode === 'mtn' ? '#333' : 'white',
          fontSize: 16, fontWeight: 800, cursor: loading || !montantNum || methode === 'carte' ? 'not-allowed' : 'pointer',
          opacity: !montantNum || montantNum < 100 || methode === 'carte' ? 0.5 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
        {loading ? 'Enregistrement…' : montantNum ? `Donner ${formatXAF(montantNum)}` : 'Choisir un montant'}
      </button>

      <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
        Votre générosité contribue à la vie de la cathédrale et à ses œuvres sociales.
        Que Dieu vous bénisse. 🙏
      </p>
    </div>
  )
}
