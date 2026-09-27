'use client'

import { useEffect, useRef } from 'react'

/**
 * CAPTCHA Cloudflare Turnstile pour la connexion, l'inscription et la
 * réinitialisation du mot de passe. Le jeton est vérifié par Supabase Auth
 * (Authentication → Attack Protection → CAPTCHA, fournisseur Turnstile).
 *
 * Inactif tant que NEXT_PUBLIC_TURNSTILE_SITE_KEY n'est pas défini.
 */

export const CLE_TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string
  remove(id: string): void
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let chargement: Promise<void> | null = null
function chargerTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  // Script ajouté par notre propre code (nonce + 'strict-dynamic' dans la CSP).
  chargement ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { chargement = null; reject(new Error('Turnstile indisponible')) }
    document.head.appendChild(s)
  })
  return chargement
}

/** Change la valeur de `cycle` pour obtenir un nouveau jeton (un jeton ne sert qu'une fois). */
export function Captcha({ onJeton, cycle = 0 }: { onJeton: (jeton: string | null) => void; cycle?: number }) {
  const conteneur = useRef<HTMLDivElement>(null)
  const rappel = useRef(onJeton)
  rappel.current = onJeton

  useEffect(() => {
    if (!CLE_TURNSTILE || !conteneur.current) return
    let id: string | null = null
    let annule = false
    rappel.current(null)
    chargerTurnstile().then(() => {
      if (annule || !conteneur.current || !window.turnstile) return
      id = window.turnstile.render(conteneur.current, {
        sitekey: CLE_TURNSTILE,
        language: 'fr',
        callback: (jeton: string) => rappel.current(jeton),
        'expired-callback': () => rappel.current(null),
        'error-callback': () => rappel.current(null),
      })
    }).catch(() => rappel.current(null))
    return () => { annule = true; if (id && window.turnstile) window.turnstile.remove(id) }
  }, [cycle])

  if (!CLE_TURNSTILE) return null
  return <div ref={conteneur} style={{ minHeight: 65, display: 'flex', justifyContent: 'center' }} />
}
