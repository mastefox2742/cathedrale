'use client'

/** Erreur dans la mise en page elle-même : page minimale, sans détail technique. */
export default function ErreurGlobale({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ color: '#123B5D' }}>Une erreur est survenue</h1>
          <p>Réessayez dans un instant.</p>
          <button onClick={reset} style={{ padding: '10px 20px', cursor: 'pointer' }}>Réessayer</button>
        </div>
      </body>
    </html>
  )
}
