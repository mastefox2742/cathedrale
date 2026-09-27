import type { Metadata } from 'next'
import { CaptchaMobile } from './CaptchaMobile'

export const metadata: Metadata = { title: 'Vérification', robots: { index: false } }

/** Page affichée dans l'application mobile (WebView) pour le CAPTCHA Turnstile. */
export default function Page() {
  return <CaptchaMobile />
}
