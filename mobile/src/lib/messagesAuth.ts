/**
 * Messages d'erreur d'authentification : génériques (pas de détail technique,
 * pas d'indication sur l'existence d'un compte). Mêmes règles que le site
 * (src/lib/securite/messagesAuth.ts).
 */
export const MESSAGE_GENERIQUE = 'Une erreur est survenue. Réessayez dans un instant.'

export function messageAuth(err: unknown): string {
  const m = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase()
  if (m.includes('captcha')) return 'Vérification anti-robot échouée. Réessayez.'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('429')) return 'Trop de tentatives. Réessayez dans quelques minutes.'
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Email ou mot de passe incorrect.'
  if (m.includes('email not confirmed')) return 'Adresse email non confirmée : ouvrez le lien reçu par email.'
  if (m.includes('pwned') || m.includes('leaked') || m.includes('compromised')) return 'Ce mot de passe figure dans des fuites connues : choisissez-en un autre.'
  if (m.includes('password') && (m.includes('weak') || m.includes('short') || m.includes('characters'))) return 'Mot de passe trop faible : au moins 8 caractères, avec lettres et chiffres.'
  return MESSAGE_GENERIQUE
}
