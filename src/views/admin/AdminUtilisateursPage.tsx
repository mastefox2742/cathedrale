'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getAllProfiles, updateUserRole, updateUserActif, updateUserVerification, ROLE_LABELS,
  type UserProfile, type GlobalRole, type ParishRole,
} from '../../services/auth'
import { useAuth, useDroits } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'

const ROLE_GROUPS: { label: string; roles: GlobalRole[] }[] = [
  { label: 'Gouvernance', roles: ['archeveque', 'admin', 'admin_diocesain'] },
  { label: 'Responsables diocésains', roles: ['admin_evangelisation', 'coordinateur_catechese_diocesain', 'responsable_media_diocesain', 'responsable_securite'] },
]

interface RoleParoisse { role: ParishRole; paroisse: string }

async function getRolesParoissiaux(): Promise<Map<string, RoleParoisse[]>> {
  const { data, error } = await supabase.from('parish_members').select('user_id, role, parishes(nom)').neq('role', 'membre')
  if (error) throw error
  const map = new Map<string, RoleParoisse[]>()
  for (const r of data ?? []) {
    const par = (Array.isArray(r.parishes) ? r.parishes[0] : r.parishes) as { nom: string } | null
    const list = map.get(r.user_id) ?? []
    list.push({ role: r.role as ParishRole, paroisse: par?.nom ?? '?' })
    map.set(r.user_id, list)
  }
  return map
}

export function AdminUtilisateursPage() {
  const { profile: currentProfile } = useAuth()
  const droits = useDroits()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [rolesParoisse, setRolesParoisse] = useState<Map<string, RoleParoisse[]>>(new Map())
  const [recherche, setRecherche] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const [p, r] = await Promise.all([getAllProfiles(), getRolesParoissiaux()])
      setProfiles(p)
      setRolesParoisse(r)
    }
    catch { showToast('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (!droits.isDiocesanAdmin) {
    return (
      <div style={{ padding: '32px 36px', fontFamily: 'var(--font-sans)' }}>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>lock</span>
          <p>Accès réservé à l'administration diocésaine.</p>
        </div>
      </div>
    )
  }

  async function handleRoleChange(p: UserProfile, role: string) {
    try {
      await updateUserRole(p.uid, (role || null) as GlobalRole | null)
      showToast('Rôle mis à jour ✓')
      await load()
    } catch { showToast('Erreur', 'err') }
  }

  async function handleActifChange(p: UserProfile, actif: boolean) {
    try {
      await updateUserActif(p.uid, actif)
      showToast(actif ? 'Compte réactivé ✓' : 'Compte désactivé ✓')
      await load()
    } catch { showToast('Erreur', 'err') }
  }

  async function handleVerificationChange(p: UserProfile, verifie: boolean) {
    try {
      await updateUserVerification(p.uid, verifie)
      showToast(verifie ? 'Marqué comme vérifié ✓' : 'Vérification retirée ✓')
      await load()
    } catch { showToast('Erreur', 'err') }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, fontFamily: 'var(--font-sans)' }}>

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

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
          Utilisateurs & Rôles
        </h1>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
          {profiles.length} compte{profiles.length > 1 ? 's' : ''} · Rôles archidiocésains ici ; les rôles paroissiaux se donnent depuis la fiche de chaque <Link href="/admin/paroisses" style={{ color: 'var(--primary)' }}>paroisse</Link>
        </p>
      </div>

      <input
        value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher un nom ou un email…"
        style={{ ...selectStyle, width: '100%', maxWidth: 360, marginBottom: 16, cursor: 'text' }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)', textAlign: 'left' }}>
                {['Nom', 'Email', 'Rôle archidiocésain', 'Rôles paroissiaux', 'Statut', 'Habilitation', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.filter(p => {
                const q = recherche.trim().toLowerCase()
                return !q || (p.nom ?? '').toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
              }).map(p => (
                <tr key={p.uid} style={{ borderTop: '1px solid var(--outline-variant)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>{p.nom || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface-variant)' }}>{p.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={p.role ?? ''} onChange={e => handleRoleChange(p, e.target.value)} style={selectStyle} disabled={p.uid === currentProfile?.uid}>
                      <option value="">— Aucun rôle archidiocésain —</option>
                      {ROLE_GROUPS.map(g => (
                        <optgroup key={g.label} label={g.label}>
                          {g.roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--on-surface-variant)' }}>
                    {(rolesParoisse.get(p.uid) ?? []).map((r, i) => (
                      <div key={i}>{ROLE_LABELS[r.role]} · <strong>{r.paroisse}</strong></div>
                    ))}
                    {!rolesParoisse.get(p.uid)?.length && '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleActifChange(p, !p.actif)}
                      disabled={p.uid === currentProfile?.uid}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: 'none',
                        cursor: p.uid === currentProfile?.uid ? 'not-allowed' : 'pointer',
                        background: p.actif ? 'rgba(46,125,50,.12)' : 'rgba(0,0,0,.06)',
                        color: p.actif ? '#2e7d32' : 'var(--on-surface-variant)',
                        opacity: p.uid === currentProfile?.uid ? 0.6 : 1,
                      }}
                    >
                      {p.actif ? 'Actif' : 'Désactivé'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleVerificationChange(p, !p.verifieSecurite)}
                      title={p.dateVerification ? `Vérifié le ${new Date(p.dateVerification).toLocaleDateString('fr-FR')}` : "Vérification (habilitation/antécédents) auprès de mineurs, réalisée hors de l'application"}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                        background: p.verifieSecurite ? 'rgba(21,101,192,.12)' : 'rgba(0,0,0,.06)',
                        color: p.verifieSecurite ? '#1565C0' : 'var(--on-surface-variant)',
                      }}
                    >
                      {p.verifieSecurite ? '✓ Vérifié' : 'Non vérifié'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                    {p.uid === currentProfile?.uid ? '(vous)' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1.5px solid var(--outline-variant)',
  borderRadius: 10, fontSize: 13, outline: 'none',
  fontFamily: 'var(--font-sans)', background: 'white', cursor: 'pointer', minWidth: 200,
}
