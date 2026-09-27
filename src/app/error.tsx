'use client'

/** Erreur inattendue : message générique, jamais de détail technique ni de trace. */
export default function Erreur({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--v2-font-serif, serif)', fontSize: 26, color: 'var(--primary, #123B5D)' }}>Une erreur est survenue</h1>
      <p style={{ fontSize: 14, color: 'var(--text-mid, #555)', maxWidth: 420 }}>La page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={reset} className="btn-gold">Réessayer</button>
        <a href="/" className="btn-outline">Accueil</a>
      </div>
    </div>
  )
}
