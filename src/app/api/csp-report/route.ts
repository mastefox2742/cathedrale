/**
 * Réception des rapports de la Content-Security-Policy (appliquée par src/proxy.ts).
 * Les écarts apparaissent dans les journaux Vercel (Runtime Logs) : c'est la
 * trace de tout ce que la politique a bloqué.
 */
/** Garde l'origine et le chemin, jamais les paramètres (?code=, ?email=…) : pas de données personnelles dans les journaux. */
function sansParametres(u: unknown): string | null {
  if (typeof u !== 'string' || !u) return null
  try { const x = new URL(u); return x.origin + x.pathname } catch { return u.split(/[?#]/)[0].slice(0, 200) }
}

export async function POST(req: Request) {
  try {
    const texte = (await req.text()).slice(0, 4000)
    const corps = JSON.parse(texte || '{}')
    // Ancien format (report-uri) : { "csp-report": {...} } ; nouveau (Reporting API) : [{ body: {...} }]
    const rapports = Array.isArray(corps) ? corps.map(r => r.body ?? r) : [corps['csp-report'] ?? corps]
    for (const r of rapports.slice(0, 10)) {
      if (!r || typeof r !== 'object') continue
      console.warn('[CSP]', JSON.stringify({
        directive: r['violated-directive'] ?? r.effectiveDirective,
        bloque: sansParametres(r['blocked-uri'] ?? r.blockedURL),
        page: sansParametres(r['document-uri'] ?? r.documentURL),
      }))
    }
  } catch { /* rapport illisible : ignoré */ }
  return new Response(null, { status: 204 })
}
