# Checklist sécurité — état de conformité

Référence : *Checklist Sécurité Web & Mobile* (Agent Cybersécurité v2.0), fournie le 27 septembre 2026.

Légende : ✅ en place dans le code · 🔧 réglage à faire dans un tableau de bord (Supabase, Vercel, GitHub, Cloudflare) · ⚠️ limite technique expliquée · — sans objet

## Authentification & sessions

| Exigence | État | Où / comment |
|---|---|---|
| OAuth 2.0 / OIDC, pas de gestion maison des mots de passe | ✅ | Supabase Auth (mots de passe hachés et sessions gérés par Supabase). |
| MFA obligatoire pour les admins, proposé à tous | ✅ 🔧 | TOTP Supabase. **Base de données** : tout droit de staff exige une session `aal2` (migration `20260929000000_securite_mfa.sql`, 5 tests SQL). **Site** : `src/proxy.ts` envoie tout compte staff sans code vers `/admin/mfa` (enrôlement par QR code puis code). **Application** : l'espace staff demande le code. **Tous** : Espace membre › Sécurité du compte, code demandé à la connexion une fois activé. 🔧 Appliquer la migration après le déploiement. |
| Protection brute force (5 essais, verrouillage 15 min, CAPTCHA) | ✅ 🔧 ⚠️ | CAPTCHA Cloudflare Turnstile sur connexion, inscription et mot de passe oublié (site, admin, application via `/captcha-mobile`). Limite de débit sur `/connexion` et `/admin/login`. 🔧 Activer Turnstile (voir « Réglages »). ⚠️ Supabase n'offre pas de verrouillage *par compte* sans plan Team (hook de vérification du mot de passe) : l'équivalent est la limite par IP de Supabase Auth + le CAPTCHA. |
| Réinitialisation sûre (jeton unique, 15 min) | ✅ 🔧 | Lien à usage unique (Supabase), page « Nouveau mot de passe », message identique que l'adresse existe ou non. 🔧 Durée du lien à 900 s. |
| Hachage bcrypt / argon2 | ✅ | bcrypt (Supabase Auth). |
| Session invalidée au logout | ✅ ⚠️ | `signOut()` révoque les jetons de renouvellement côté serveur. ⚠️ Supabase ne tient pas de liste noire des jetons d'accès : ils expirent seuls → 🔧 durée de vie des jetons à 15 min. |

## Protection des données & RGPD

| Exigence | État | Où / comment |
|---|---|---|
| Chiffrement at-rest | ✅ ⚠️ | Base Supabase chiffrée (AES-256, disques) ; session de l'application chiffrée (AES-256, clé dans le Keychain/Keystore). ⚠️ Pas de chiffrement colonne par colonne des dossiers enfants/signalements (possible plus tard avec Supabase Vault). |
| Consentement, droit à l'oubli, portabilité | ✅ | Page `/confidentialite` (lien dans le pied de page), case de consentement à l'inscription (site et application), export JSON et suppression du compte dans l'Espace membre. Aucun cookie de suivi → pas de bandeau nécessaire. |
| Backups chiffrés et testés | 🔧 | Sauvegardes quotidiennes Supabase = plan Pro (le plan gratuit n'en fait pas). Tester une restauration chaque mois (projet de test). |
| Logs sans données personnelles | ✅ | Rapports CSP sans paramètres d'URL ; fonction Edge : codes d'erreur uniquement. Le journal d'audit interne garde des identifiants (usage prévu : qui a fait quoi). |
| Minimisation, durées de conservation | ✅ 🔧 | Durées publiées dans `/confidentialite`. 🔧 Purge automatique à programmer (tâche planifiée Supabase). |

## Réseau, API & en-têtes HTTP

| Exigence | État | Où / comment |
|---|---|---|
| Content-Security-Policy | ✅ | Stricte et bloquante : nonce par requête + `'strict-dynamic'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'` (`src/proxy.ts`). Violations reçues sur `/api/csp-report`. À vérifier sur csp-evaluator.withgoogle.com. |
| En-têtes de sécurité | ✅ | `X-Frame-Options: DENY`, `nosniff`, HSTS (2 ans, preload), `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` (`next.config.mjs`). |
| Protection CSRF | ✅ | Aucune modification authentifiée par cookie : les écritures passent par l'API Supabase avec l'en-tête `Authorization`. Les requêtes GET ne modifient rien (API publique en lecture seule). Cookies de session `SameSite=Lax`. |
| Rate limiting par endpoint | ✅ 🔧 | `src/lib/securite/limiteur.ts` : API publique 100/min, AELF 60/min, rapports CSP 30/min, pages de connexion 20–30/min (429 au-delà). 🔧 Même règle en global dans le pare-feu Vercel ; limites Supabase Auth. Paiement en ligne : — (pas de prestataire de paiement, dons par référence Mobile Money). |
| TLS 1.2+, certificats renouvelés | ✅ | Vercel et Supabase (TLS 1.2/1.3, certificats automatiques). À vérifier sur ssllabs.com. |
| Pas de données sensibles dans les URLs | ✅ | Suivi de démarche par POST (RPC). Seuls les liens d'email Supabase portent un code à usage unique (standard). |
| WAF | 🔧 | Pare-feu Vercel (règles gérées, mode « Attack Challenge ») ou Cloudflare devant le domaine définitif. |

## Code & dépendances

| Exigence | État | Où / comment |
|---|---|---|
| SAST automatisé | ✅ | Semgrep (OWASP Top 10, TypeScript, React) + CodeQL à chaque push (`.github/workflows`). |
| Audit des dépendances | ✅ | `npm audit` (site + application) à chaque push et chaque lundi ; Dependabot. `npm run securite:audit` en local. |
| Scan de secrets + hook pre-commit | ✅ | gitleaks en CI ; hook `.githooks/pre-commit` (`scripts/securite/scan-secrets.mjs`), activé par `npm install`. |
| Revue de code avec checklist sécurité | ✅ | Modèle de pull request `.github/pull_request_template.md`. |
| Pas de traces d'erreur en production | ✅ | Pages d'erreur génériques (`src/app/error.tsx`, `global-error.tsx`), messages d'authentification génériques, API et fonction Edge sans détail technique. |

## Mobile

| Exigence | État | Où / comment |
|---|---|---|
| Stockage sécurisé des jetons | ✅ | `expo-secure-store` (Keychain/Keystore) + AES-256 (`mobile/src/services/stockageSecurise.ts`) ; plus rien en clair dans AsyncStorage. |
| Certificate pinning | ⚠️ | Non appliqué : épingler les certificats de Supabase bloquerait **toute** l'application le jour où ils changent (rotation automatique). À décider avec un plan de rotation (module `react-native-ssl-public-key-pinning`, clés de secours). |
| Obfuscation, pas de secret dans le bundle | ✅ | Bytecode Hermes (Expo) ; le bundle ne contient que la clé publique « anon » (protégée par la RLS). |
| Verrouillage biométrie / code | ✅ | Après 10 min en arrière-plan et au démarrage, pour une personne connectée (`VerrouApp`). |
| Permissions minimales, au bon moment | ✅ | Localisation au toucher de « Autour de moi » ; notifications seulement via Plus › « Recevoir les notifications », avec explication ; Face ID justifié. |

## Infrastructure & supervision

| Exigence | État | Où / comment |
|---|---|---|
| Secrets centralisés, zéro secret dans git | ✅ 🔧 | Secrets dans Vercel, Supabase (Edge Functions) et EAS ; dépôt scanné (531 fichiers, aucun secret) ; `.gitignore` renforcé. 🔧 Doppler facultatif. |
| Alertes sur anomalies | 🔧 | Alertes Vercel (erreurs 5xx, trafic), rapports d'usage Supabase ; journaux `[CSP]`. |
| Moindre privilège | ✅ 🔧 | RLS active sur les 43 tables, droits par rôle et par paroisse ; clé `service_role` seulement dans la fonction Edge. 🔧 Revoir les membres des équipes Vercel/Supabase/GitHub. |
| Plan de réponse aux incidents | ✅ | `docs/securite/plan-incident.md`. |
| Test d'intrusion avant production | 🔧 | OWASP ZAP (analyse de base) puis test professionnel annuel. |

## Sécurité IA

— Aucune IA n'est intégrée à la plateforme : sans objet. À reprendre si un assistant est ajouté (clé côté serveur, limite de débit, pas de données personnelles dans les prompts, validation des réponses).

## Architecture (6 couches)

Couvertes par les sections ci-dessus. Points spécifiques :
- **Cookies `HttpOnly`** ⚠️ : les cookies de session `@supabase/ssr` sont `Secure` et `SameSite=Lax` mais lisibles par le script (le client Supabase du navigateur en a besoin). La CSP stricte empêche l'injection de scripts qui pourraient les lire.
- **Staging avant production** 🔧 : aujourd'hui, un push sur `main` part en production. Recommandé : travailler sur des branches (aperçus Vercel) et un projet Supabase de test.
- **Base jamais exposée directement** 🔧 : Supabase › Settings › Network Restrictions (connexions Postgres directes limitées).

## Réglages à faire dans les tableaux de bord

**Supabase** (Authentication) :
1. *Sign In / Providers › Email* : durée du lien de réinitialisation / OTP = `900` s ; mots de passe : 8 caractères minimum, lettres + chiffres ; *Leaked password protection* (plan Pro).
2. *Sessions* : durée des jetons d'accès (JWT expiry) = `900` s ; rotation des jetons de renouvellement activée.
3. *Multi-Factor* : TOTP activé (par défaut).
4. *Attack Protection › CAPTCHA* : fournisseur Turnstile + clé secrète Cloudflare ; *Rate Limits* : connexions/inscriptions ≈ 5 par minute et par IP.
5. SQL : appliquer `mobile/supabase/migrations/20260929000000_securite_mfa.sql` **après** le déploiement du site et l'enrôlement des administrateurs.
6. Edge Functions › `send-notification` › Secrets : `ALLOWED_ORIGINS=https://cathedrale.vercel.app` puis redéployer la fonction.

**Cloudflare** : créer un widget Turnstile pour `cathedrale.vercel.app` → clé du site et clé secrète.

**Vercel** (Settings › Environment Variables) : `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ; `API_CORS_ORIGINS` (sites autorisés à lire l'API publique, séparés par des virgules). Firewall : règle de limite de débit et règles gérées.

**EAS / application** : `EXPO_PUBLIC_TURNSTILE_SITE_KEY` puis nouveau build.

**GitHub** : Settings › Code security : Dependabot alerts, Secret scanning + Push protection ; protection de la branche `main` (checks « Sécurité » obligatoires).
