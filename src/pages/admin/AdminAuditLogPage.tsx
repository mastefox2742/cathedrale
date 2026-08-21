import { useEffect, useState } from 'react'
import { getAuditLogs, RESOURCE_LABELS, type AuditLog, type AuditAction } from '../../services/auditLog'
import { useAuth } from '../../contexts/AuthContext'

const ACTION_STYLE: Record<AuditAction, { label: string; bg: string; color: string; icon: string }> = {
  create: { label: 'Création', bg: '#e8f5e9', color: '#2e7d32', icon: 'add_circle' },
  update: { label: 'Modification', bg: 'rgba(0,35,111,0.08)', color: 'var(--primary)', icon: 'edit' },
  delete: { label: 'Suppression', bg: '#ffebee', color: '#c62828', icon: 'delete' },
}

function formatDate(log: AuditLog): string {
  if (!log.createdAt) return '—'
  const date = new Date(log.createdAt)
  return date.toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AdminAuditLogPage() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<'tous' | AuditAction>('tous')

  useEffect(() => {
    if (profile?.role !== 'admin') return
    getAuditLogs()
      .then(setLogs)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [profile?.role])

  if (profile?.role !== 'admin') {
    return (
      <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>lock</span>
          <p>Les journaux d'audit sont réservés aux administrateurs.</p>
        </div>
      </div>
    )
  }

  const visible = filter === 'tous' ? logs : logs.filter(l => l.action === filter)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, fontFamily: 'var(--font-sans)' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--primary)', marginBottom: 4 }}>
            Journaux d'audit
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {logs.length} action{logs.length > 1 ? 's' : ''} enregistrée{logs.length > 1 ? 's' : ''} (200 dernières)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['tous', 'create', 'update', 'delete'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
                background: filter === f ? 'var(--primary)' : 'var(--surface-container)',
                color: filter === f ? 'white' : 'var(--on-surface-variant)',
              }}
            >
              {f === 'tous' ? 'Toutes' : ACTION_STYLE[f].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }}>sync</span>
          Chargement…
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>error</span>
          <p>Impossible de charger les journaux d'audit.</p>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>history</span>
          <p>Aucune action enregistrée pour l'instant.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(log => {
            const style = ACTION_STYLE[log.action]
            return (
              <div key={log.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: style.bg, color: style.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, color: 'var(--on-surface)' }}>
                    <strong>{style.label}</strong> — {RESOURCE_LABELS[log.resource] ?? log.resource}
                    {log.summary && <span style={{ color: 'var(--on-surface-variant)' }}> « {log.summary} »</span>}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>{log.userEmail}</p>
                </div>
                <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', flexShrink: 0, whiteSpace: 'nowrap' }}>{formatDate(log)}</span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
