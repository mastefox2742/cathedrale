#!/usr/bin/env node
/**
 * Détection de secrets avant commit (hook .githooks/pre-commit) et en CI.
 *
 *   node scripts/securite/scan-secrets.mjs          → fichiers indexés (git add)
 *   node scripts/securite/scan-secrets.mjs --tout   → tous les fichiers suivis
 *
 * Bloque le commit si une clé ressemble à un vrai secret. Faux positif avéré :
 * ajouter « secret-scan:ignore » en commentaire sur la ligne concernée.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const REGLES = [
  ['Clé privée (PEM)', /-----BEGIN [A-Z ]*PRIVATE KEY-----\s*[A-Za-z0-9+/=\s]{64,}/],
  ['Clé AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['Clé Google / Firebase serveur', /"private_key_id"\s*:\s*"[0-9a-f]{20,}"/],
  ['Clé Stripe secrète', /\bsk_(live|test)_[0-9a-zA-Z]{20,}/],
  ['Jeton GitHub', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['Clé Anthropic / OpenAI', /\bsk-(ant-)?[A-Za-z0-9_-]{30,}/],
  ['Clé Supabase service_role', /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]*c2VydmljZV9yb2xl[A-Za-z0-9_-]*\.[A-Za-z0-9_-]{10,}/],
  ['Mot de passe dans une URL', /[a-z]+:\/\/[^\s:/@]+:[^\s:/@]{6,}@[^\s]+/i],
  ['Variable secrète renseignée', /^\s*(?:[A-Z0-9_]*(?:SECRET|PASSWORD|PRIVATE_KEY|SERVICE_ROLE)[A-Z0-9_]*)\s*=\s*["']?(?!change|xxx|<|\$\{|your|votre|exemple|example)[^\s"']{12,}/m],
]
const IGNORES = [/^node_modules\//, /\/node_modules\//, /^design-reference\//, /\.(png|jpe?g|webp|gif|mp4|pdf|ico|woff2?|ttf|lock)$/i, /package-lock\.json$/, /^scripts\/securite\/scan-secrets\.mjs$/, /^dev-dist\//]

const tout = process.argv.includes('--tout')
const fichiers = execFileSync('git', tout ? ['ls-files'] : ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { encoding: 'utf8' })
  .split('\n').map(f => f.trim()).filter(f => f && !IGNORES.some(r => r.test(f)))

const trouvailles = []
for (const f of fichiers) {
  let contenu
  try {
    contenu = tout ? readFileSync(f, 'utf8') : execFileSync('git', ['show', `:${f}`], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  } catch { continue }
  if (/\.env(\.|$)/.test(f.split('/').pop()) && !f.endsWith('.example')) trouvailles.push([f, 0, 'Fichier .env (ne jamais le committer)'])
  const lignes = contenu.split('\n')
  for (const [nom, re] of REGLES) {
    const m = re.exec(contenu)
    if (!m) continue
    const ligne = contenu.slice(0, m.index).split('\n').length
    if (lignes[ligne - 1]?.includes('secret-scan:ignore')) continue
    trouvailles.push([f, ligne, nom])
  }
}

if (trouvailles.length) {
  console.error('\n✖ Secret potentiel détecté — commit bloqué :\n')
  for (const [f, l, nom] of trouvailles) console.error(`  ${f}${l ? `:${l}` : ''}  →  ${nom}`)
  console.error('\nPlacez la valeur dans une variable d\'environnement (Vercel / Supabase / EAS) et retirez-la du fichier.\n')
  process.exit(1)
}
if (tout) console.log(`✓ Aucun secret détecté (${fichiers.length} fichiers).`)
