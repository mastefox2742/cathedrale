import { useEffect, useState } from 'react'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Stats {
  annonces: number
  annoncesPinned: number
  homelies: number
  formations: number
}

async function fetchStats(): Promise<Stats> {
  const [annonces, pinned, homelies, formations] = await Promise.all([
    getCountFromServer(query(collection(db, 'annonces'), where('publie', '==', true))),
    getCountFromServer(query(collection(db, 'annonces'), where('epingle', '==', true))),
    getCountFromServer(query(collection(db, 'homelies'), where('publie', '==', true))),
    getCountFromServer(collection(db, 'formations')),
  ])
  return {
    annonces: annonces.data().count,
    annoncesPinned: pinned.data().count,
    homelies: homelies.data().count,
    formations: formations.data().count,
  }
}

export function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setStats({ annonces: 0, annoncesPinned: 0, homelies: 0, formations: 0 }))
      .finally(() => setLoadingStats(false))
  }, [])

  const KPIS = [
    {
      label: 'Annonces publiées',
      value: stats?.annonces,
      sub: `${stats?.annoncesPinned ?? '—'} épinglées`,
      icon: 'campaign',
      color: 'var(--primary)',
      bg: 'rgba(0,35,111,0.06)',
      to: '/admin/annonces',
    },
    {
      label: 'Homélies en ligne',
      value: stats?.homelies,
      sub: 'Texte & audio',
      icon: 'record_voice_over',
      color: '#2e7d32',
      bg: 'rgba(46,125,50,0.06)',
      to: '/admin/homelies',
    },
    {
      label: 'Parcours de formation',
      value: stats?.formations,
      sub: 'Catéchèse & laïcs',
      icon: 'school',
      color: 'var(--secondary)',
      bg: 'rgba(115,92,0,0.06)',
      to: '/admin/formations',
    },
    {
      label: 'Intentions de prière',
      value: '—',
      sub: 'Bientôt disponible',
      icon: 'volunteer_activism',
      color: 'var(--liturgy-purple)',
      bg: 'rgba(123,31,162,0.06)',
      to: '/admin',
    },
  ]

  const SHORTCUTS = [
    { label: 'Nouvelle annonce',    icon: 'add_circle',   to: '/admin/annonces',  primary: true },
    { label: 'Publier une homélie', icon: 'mic',          to: '/admin/homelies',  primary: true },
    { label: 'Gérer les formations',icon: 'edit_note',    to: '/admin/formations',primary: false },
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
            Paroisse Saint Michel de la Base · Archidiocèse de Brazzaville
          </p>
        </div>
      </div>

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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ color, fontSize: 22, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <span style={{
                fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 700, color,
                lineHeight: 1,
              }}>
                {loadingStats ? '…' : (value ?? '—')}
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{sub}</p>
          </div>
        ))}
      </div>

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

      {/* ── Info Firestore ── */}
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'rgba(0,35,111,0.04)', border: '1px solid rgba(0,35,111,0.1)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
          Base de données connectée — Firebase Firestore · Stockage Firebase Storage
        </p>
        <span style={{
          marginLeft: 'auto', padding: '3px 10px', borderRadius: 20,
          background: '#e8f5e9', color: '#2e7d32', fontSize: 12, fontWeight: 700,
        }}>En ligne</span>
      </div>
    </div>
  )
}
