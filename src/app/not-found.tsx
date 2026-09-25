import Link from 'next/link'
import { Layout2 } from '../components/layout/Layout2'

export default function NotFound() {
  return (
    <Layout2>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Page introuvable</p>
          <h1>Cette page <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>n&apos;existe pas</em></h1>
        </div>
      </div>
      <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 24 }}>Le lien est peut-être ancien ou mal saisi.</p>
        <Link href="/" className="btn-gold">Retour à l&apos;accueil</Link>
      </div>
    </Layout2>
  )
}
