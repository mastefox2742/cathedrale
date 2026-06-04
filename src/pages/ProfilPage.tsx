import { PageWrapper } from '../components/layout/PageWrapper'
export function ProfilPage() {
  return (
    <div style={{ padding: '0 var(--margin) var(--space-lg)' }}>
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>Mon Profil</h1>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>Bientôt disponible — Phase 2</p>
      </div>
      <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--outline-variant)', display: 'block', marginBottom: 16 }}>person</span>
        <p className="text-title-md" style={{ color: 'var(--on-surface)', marginBottom: 8 }}>Espace personnel</p>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 24 }}>
          Suivez vos parcours de catéchèse, vos intentions de prière et vos notifications personnalisées.
        </p>
        <button className="btn-primary" style={{ margin: '0 auto' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
          Se connecter
        </button>
      </div>
    </div>
  )
}
