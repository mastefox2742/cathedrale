/**
 * Réception des rapports de la Content-Security-Policy (mode observation).
 * Les écarts apparaissent dans les journaux Vercel (Runtime Logs) : c'est la
 * liste à valider avant de rendre la politique bloquante.
 */
export async function POST(req: Request) {
  try {
    const texte = (await req.text()).slice(0, 4000)
    const corps = JSON.parse(texte || '{}')
    // Ancien format (report-uri) : { "csp-report": {...} } ; nouveau (Reporting API) : [{ body: {...} }]
    const rapports = Array.isArray(corps) ? corps.map(r => r.body ?? r) : [corps['csp-report'] ?? corps]
    for (const r of rapports) {
      console.warn('[CSP]', JSON.stringify({
        directive: r['violated-directive'] ?? r.effectiveDirective,
        bloque: r['blocked-uri'] ?? r.blockedURL,
        page: r['document-uri'] ?? r.documentURL,
      }))
    }
  } catch { /* rapport illisible : ignoré */ }
  return new Response(null, { status: 204 })
}
