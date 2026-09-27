/**
 * Limitation de débit par adresse IP (fenêtre glissante d'une minute).
 *
 * Mémoire locale à chaque instance du serveur : c'est une première barrière.
 * La règle de pare-feu Vercel (voir docs/securite/checklist.md) applique la
 * même limite de façon globale.
 */

const FENETRE_MS = 60_000

/** Requêtes autorisées par minute et par IP, selon le point d'accès. */
export const LIMITES: { prefixe: string; parMinute: number }[] = [
  { prefixe: '/api/csp-report', parMinute: 30 },
  { prefixe: '/api/aelf', parMinute: 60 },
  { prefixe: '/api/v1', parMinute: 100 },
  { prefixe: '/api/', parMinute: 100 },
  { prefixe: '/admin/login', parMinute: 20 },
  { prefixe: '/connexion', parMinute: 30 },
]

const compteurs = new Map<string, number[]>()

export function limitePour(chemin: string): number | null {
  return LIMITES.find(l => chemin === l.prefixe || chemin.startsWith(l.prefixe))?.parMinute ?? null
}

/** Vrai si la requête dépasse la limite (et doit recevoir un 429). */
export function depasse(ip: string, chemin: string, parMinute: number, maintenant = Date.now()): boolean {
  const cle = `${ip}|${LIMITES.find(l => chemin.startsWith(l.prefixe))?.prefixe ?? chemin}`
  const recents = (compteurs.get(cle) ?? []).filter(t => maintenant - t < FENETRE_MS)
  recents.push(maintenant)
  compteurs.set(cle, recents)
  // Nettoyage pour ne pas laisser grossir la table indéfiniment.
  if (compteurs.size > 5000) {
    for (const [k, v] of compteurs) if (!v.some(t => maintenant - t < FENETRE_MS)) compteurs.delete(k)
  }
  return recents.length > parMinute
}

export function ipDe(headers: Headers): string {
  return headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'inconnue'
}
