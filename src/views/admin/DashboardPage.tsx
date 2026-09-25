'use client'

import { useEffect, useState } from 'react'
import { useNavigate } from '../../lib/navigation'
import { useAuth, useDroits } from '../../contexts/AuthContext'
import { getStatsTableauDeBord, getStatsParParoisse, type StatsTableauDeBord, type StatsParoisse } from '../../services/stats'
import { formatXAF } from '../../services/dons'
import { getToutesParoisses } from '../../services/paroisses'
import { ARCHIDIOCESE } from '../../services/scope'
import { thStyle, tdStyle } from '../../components/admin/ui'

interface Kpi { label: string; value: string | number | undefined; sub: string; icon: string; color: string; bg: string; to: string }

export function DashboardPage() {
  const { profile } = useAuth()
  const droits = useDroits()
  const navigate = useNavigate()
  const [stats, setStats] = useState<StatsTableauDeBord | null>(null)
  const [parParoisse, setParParoisse] = useState<StatsParoisse[]>([])
  const [perimetreNom, setPerimetreNom] = useState('')
  const [loadingStats, setLoadingStats] = useState(true)
  const [erreur, setErreur] = useState(false)
  const toutArchidiocese = droits.perimetre === ARCHIDIOCESE

  useEffect(() => {
    getStatsTableauDeBord()
      .then(setStats)
      .catch(() => setErreur(true))
      .finally(() => setLoadingStats(false))
    if (toutArchidiocese) {
      setPerimetreNom("Tout l'archidiocèse")
      getStatsParParoisse().then(setParParoisse).catch(() => setParParoisse([]))
    } else if (droits.perimetre) {
      getToutesParoisses().then(p => setPerimetreNom(p.find(x => x.id === droits.perimetre)?.nom ?? '')).catch(() => {})
    }
  }, [toutArchidiocese, droits.perimetre])

  const KPIS: Kpi[] = [
    ...(toutArchidiocese ? [{ label: 'Paroisses actives', value: stats?.paroisses, sub: 'Annuaire public', icon: 'church', color: 'var(--primary)', bg: 'rgba(0,35,111,0.06)', to: '/admin/paroisses' }] : []),
    { label: 'Fidèles inscrits', value: stats?.fideles, sub: `${stats?.abonnes ?? '—'} abonnés aux actualités`, icon: 'groups', color: 'var(--primary)', bg: 'rgba(0,35,111,0.06)', to: '/admin/abonnes' },
    { label: 'Catéchistes', value: stats?.catechistes, sub: `${stats?.enfants ?? '—'} enfants suivis`, icon: 'school', color: 'var(--secondary)', bg: 'rgba(115,92,0,0.06)', to: '/admin/registre' },
    { label: 'Dons confirmés', value: stats ? formatXAF(stats.dons_total) : undefined, sub: `${stats?.dons_en_attente ?? '—'} en attente de vérification`, icon: 'payments', color: '#2e7d32', bg: 'rgba(46,125,50,0.06)', to: '/admin/dons' },
    { label: 'Intentions de prière', value: stats?.intentions_recues, sub: 'À traiter', icon: 'volunteer_activism', color: 'var(--liturgy-purple)', bg: 'rgba(123,31,162,0.06)', to: '/admin/intentions' },
    { label: 'Démarches pastorales', value: stats?.demandes_recues, sub: 'Nouvelles demandes', icon: 'assignment', color: 'var(--primary)', bg: 'rgba(0,35,111,0.06)', to: '/admin/demarches' },
    { label: 'Témoignages', value: stats?.temoignages_attente, sub: 'En attente de modération', icon: 'rate_review', color: '#e65100', bg: 'rgba(245,127,23,0.08)', to: '/admin/temoignages' },
    { label: 'Adhésions aux groupes', value: stats?.adhesions_nouvelles, sub: 'Nouvelles demandes', icon: 'group_add', color: 'var(--primary)', bg: 'rgba(0,35,111,0.06)', to: '/admin/groupes' },
    { label: 'Vidéos de la chaîne', value: stats?.videos, sub: `${stats?.vues_videos ?? '—'} lectures`, icon: 'smart_display', color: '#c62828', bg: 'rgba(198,40,40,0.06)', to: '/admin/tv' },
    { label: 'Parcours de foi', value: stats?.parcours_inscrits, sub: 'Participations en cours ou terminées', icon: 'route', color: 'var(--secondary)', bg: 'rgba(115,92,0,0.06)', to: '/admin/parcours' },
    ...(stats?.signalements_nouveaux != null ? [{ label: 'Signalements', value: stats.signalements_nouveaux, sub: 'Nouveaux — protection des mineurs', icon: 'shield', color: '#c62828', bg: 'rgba(198,40,40,0.06)', to: '/admin/signalements' }] : []),
  ]

  const SHORTCUTS = [
    { label: 'Nouvelle annonce',     icon: 'add_circle',  to: '/admin/annonces', primary: true },
    { label: 'Programmer un direct', icon: 'live_tv',     to: '/admin/tv',       primary: true },
    { label: 'Envoyer une notification', icon: 'notifications', to: '/admin/notifications', primary: false },
    { label: 'Parcours de foi',      icon: 'route',       to: '/admin/parcours', primary: false },
  ]

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>

      {/* ── En-tête ── */}
      <div style={{
        marginBottom: 32, padding: '24px 28px',
        background: 'linear-gradient(135deg, var(--primary) 0%, #1a3a9a 100%)',
        borderRadius: 16, color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.07 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 180, fontVariationSettings: "'FILL' 1" }}>church</span>
        </div>
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 4 }}>
            {greeting}, {profile?.nom?.split(' ')[0] || 'Admin'}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            {perimetreNom || 'Archidiocèse de Brazzaville'} · Archidiocèse de Brazzaville
          </p>
        </div>
      </div>

      {erreur && (
        <p style={{ fontSize: 13, color: '#c62828', marginBottom: 16 }}>
          Les statistiques n'ont pas pu être chargées (migration « plateforme archidiocésaine » appliquée ?).
        </p>
      )}

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {KPIS.map(({ label, value, sub, icon, color, bg, to }) => (
          <div
            key={label}
            className="card"
            onClick={() => navigate(to)}
            style={{
              padding: '20px 22px', cursor: 'pointer',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ color, fontSize: 22, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <span style={{
                fontFamily: 'var(--font-serif)', fontSize: typeof value === 'string' ? 20 : 34, fontWeight: 700, color,
                lineHeight: 1, textAlign: 'right',
              }}>
                {loadingStats ? '…' : (value ?? '—')}
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Par paroisse (vue archidiocésaine) ── */}
      {toutArchidiocese && parParoisse.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 14 }}>
            Par paroisse
          </h2>
          <div className="card" style={{ overflowX: 'auto', marginBottom: 36 }}>
            <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container)' }}>
                  {['Paroisse', 'Fidèles', 'Catéchistes', 'Enfants', 'Dons confirmés', 'Demandes', 'Catéchèse terminée'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {parParoisse.map(p => (
                  <tr key={p.parish_id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.nom}</td>
                    <td style={tdStyle}>{p.fideles}</td>
                    <td style={tdStyle}>{p.catechistes}</td>
                    <td style={tdStyle}>{p.enfants}</td>
                    <td style={tdStyle}>{formatXAF(p.dons_total)}</td>
                    <td style={tdStyle}>{p.demandes_recues}</td>
                    <td style={tdStyle}>{p.parcours_termines}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Accès rapides ── */}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 14 }}>
        Actions rapides
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
        {SHORTCUTS.map(({ label, icon, to, primary }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className={primary ? 'btn-primary' : 'btn-outline'}
            style={{ gap: 8 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── État de la base ── */}
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'rgba(0,35,111,0.04)', border: '1px solid rgba(0,35,111,0.1)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
          Base de données connectée — Supabase
        </p>
        <span style={{
          marginLeft: 'auto', padding: '3px 10px', borderRadius: 20,
          background: erreur ? '#ffebee' : '#e8f5e9', color: erreur ? '#c62828' : '#2e7d32', fontSize: 12, fontWeight: 700,
        }}>{erreur ? 'À vérifier' : 'En ligne'}</span>
      </div>
    </div>
  )
}
