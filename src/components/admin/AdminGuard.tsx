import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 48, color: 'var(--primary)', display: 'block', marginBottom: 12,
            animation: 'spin 1s linear infinite',
          }}>sync</span>
          <p style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-sans)' }}>Vérification…</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) return <Navigate to="/admin/login" replace />
  if (!profile.actif) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
