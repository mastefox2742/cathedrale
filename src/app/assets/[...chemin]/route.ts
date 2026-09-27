/**
 * Ancienne version (Vite) : son service worker a pu garder en cache une page
 * qui charge /assets/index-XXXX.js, fichier qui n'existe plus. On répond à ces
 * URL par un petit script qui vide les anciens caches et recharge la page,
 * pour que les visiteurs réguliers ne restent pas sur une page blanche.
 */

const REPARATION = `(async () => {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.() ?? []
    await Promise.all(regs.map(r => r.unregister()))
    const cles = await caches?.keys?.() ?? []
    await Promise.all(cles.map(c => caches.delete(c)))
  } catch (e) { /* on recharge quand même */ }
  if (!sessionStorage.getItem('maj-plateforme')) {
    sessionStorage.setItem('maj-plateforme', '1')
    location.reload()
  }
})()`

export function GET(_req: Request, { params }: { params: Promise<{ chemin: string[] }> }) {
  return params.then(({ chemin }) => {
    const fichier = chemin.join('/')
    if (!fichier.endsWith('.js')) return new Response('', { status: 404 })
    return new Response(REPARATION, {
      headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  })
}
