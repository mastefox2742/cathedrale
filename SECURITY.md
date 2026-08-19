# Politique et regles de securite du projet

Ce document synthetise les regles de securite applicables a la plateforme
**Cathédrale Sacré-Cœur de Brazzaville**, derivees de :

- la checklist et le guide cybersecurite fournis en reference (architecture en
  6 couches, defense en profondeur, zero trust) ;
- le cahier des charges fonctionnel (section 7 "Protection des mineurs et
  confidentialite", section 6 "Roles et permissions").

**Regle d'or : l'interface (apps/web) ne doit jamais etre le seul mecanisme de
securite.** Toute regle d'affichage/masquage cote client est une commodite
UX ; la decision finale est TOUJOURS revalidee cote serveur (apps/api).

---

## 1. Architecture en couches (defense en profondeur)

| Couche | Implementation dans ce repo |
|---|---|
| Client / Frontend | Next.js, aucune logique metier sensible cote client, variables `NEXT_PUBLIC_*` uniquement exposees, CSP stricte (`next.config.js`) |
| API Gateway / Edge | A la charge de l'hebergeur (Cloudflare/Vercel/reverse proxy) en prod : WAF, DDoS protection. `app.set('trust proxy', 1)` cote NestJS pour un rate limiting correct derriere un proxy |
| Backend / Services | NestJS, validation Zod partagee (`@csc/shared`), Prisma (requetes parametrees), guards RBAC (`JwtAuthGuard` + `PermissionsGuard`) |
| Base de donnees | PostgreSQL prive (jamais expose directement), acces uniquement via Prisma, migrations versionnees |
| Auth & Sessions | JWT access (15 min) + refresh token opaque en cookie HttpOnly/Secure/SameSite=Strict (7 jours), rotation du refresh token, blacklist Redis au logout |
| Infra & Deploiement | Secrets via variables d'environnement validees au boot (`env.validation.ts`), jamais de secret par defaut tolere en production |

## 2. Authentification & sessions

- Mots de passe haches avec **Argon2id** (`memoryCost: 64MB, timeCost: 3, parallelism: 4`) - jamais SHA1/MD5/SHA256 brut.
- Access token JWT : duree de vie **15 minutes**, signe avec un secret >= 32 caracteres, jamais stocke en `localStorage` (garde en memoire cote client, cf `apps/web/src/lib/auth-context.tsx`).
- Refresh token : valeur aleatoire opaque (64 octets), stockee **hashee** (SHA-256) en base, cookie `HttpOnly + Secure (prod) + SameSite=Strict`, **rotation a chaque refresh** (detection de rejeu -> revocation globale des sessions de l'utilisateur).
- Rate limiting strict sur `/auth/login` : 5 tentatives / minute (`@Throttle` dans `AuthController`), a completer avec un CAPTCHA (Turnstile/hCaptcha) et un lockout progressif avant mise en production.
- Protection contre l'enumeration de comptes : messages d'erreur generiques + hash "dummy" verifie meme quand l'utilisateur n'existe pas (timing-safe).
- Logout : revocation du refresh token en base + blacklist Redis du `sessionId` (`sid`) pour une invalidation immediate de l'access token residuel.
- MFA (TOTP) : **non implemente dans ce squelette** - a ajouter en priorite pour tous les roles `admin`/`super_admin`/`safeguarding_officer` avant l'ouverture de l'administration en production.

## 3. Autorisation (RBAC)

- 13 roles definis dans `packages/shared/src/roles.ts` (`visitor` -> `super_admin`), cumulables.
- Matrice de permissions `PERMISSIONS` + fonction `hasPermission()` **partagee** entre `apps/web` (affichage) et `apps/api` (`PermissionsGuard`, decorateur `@RequirePermission()`) : une seule source de verite.
- Principe du moindre privilege : ne jamais elargir un `allowedRoles` sans revue explicite. Un responsable de groupe ne doit voir que les donnees de son perimetre (filtrage applicatif, ex: `WHERE groupId = ...`, a implementer service par service).
- Attribution des roles reservee au `super_admin` (`role_assignment:manage`).

## 4. Protection des donnees & RGPD

- Collecte minimale : les schemas Zod (`packages/shared/src/schemas`) ne demandent que les champs necessaires.
- Droit a l'oubli / portabilite : a implementer (endpoints `DELETE /users/me`, export JSON) avant l'ouverture publique des comptes.
- Aucune donnee bancaire ni secret de paiement stocke en base (cahier des charges 5.12) - integration Mobile Money via un prestataire, verification cote serveur uniquement.
- Logs applicatifs sans PII : `LoggingInterceptor` redacte les champs sensibles (`password`, `token`, `secret`, ...) et anonymise les IP (dernier octet/segment masque).
- Donnees sensibles a acces tres restreint (intentions de priere, signalements de protection des mineurs) : permissions dediees `prayer_request:view` et `safeguarding_report:view`, limitees aux roles habilites (cf `roles.ts`).

## 5. Protection des mineurs (obligatoire avant toute fonctionnalite sociale)

- Un profil enfant (`ChildProfile`) est **toujours** rattache a un `parentId` (cahier des charges 5.5) - jamais de compte autonome pour un enfant.
- Aucune messagerie privee adulte-mineur ne doit etre implementee (regle produit, pas seulement technique).
- Toute action sur un signalement (`safeguarding_report`) doit passer par `AuditLogService.record()`.
- Photos/videos d'enfants : necessitent une autorisation explicite (a modeliser via un champ `consents` avant d'activer l'upload de media impliquant des mineurs).

## 6. Reseau & headers HTTP

- CORS : liste blanche explicite via `CORS_ORIGINS` (jamais `*`), `credentials: true` pour le cookie de refresh.
- Headers de securite (`apps/web/next.config.js` + `helmet` dans `apps/api/src/main.ts`) : CSP stricte, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS en production.
- TLS 1.2+ termine par l'hebergeur/reverse proxy - jamais gere par l'application elle-meme.
- Tester `securityheaders.com`, `csp-evaluator.withgoogle.com` et `ssllabs.com/ssltest` avant chaque mise en production.

## 7. Securite du code & dependances

- ESLint avec `eslint-plugin-security` actif sur tout le monorepo (`packages/config/eslint-config`).
- `pnpm audit --audit-level=high` en CI (voir `.github/workflows/ci.yml`).
- Scan de secrets recommande en pre-commit (git-secrets / trufflehog) - a brancher via Husky (`prepare` deja configure a la racine).
- Aucune stack trace ni detail technique renvoye au client : `AllExceptionsFilter` retourne un `errorId` correle aux logs serveur.

## 8. PWA & hors ligne

- Service worker minimal fourni (`apps/web/public/sw.js`, strategie network-first + fallback cache) : **point de depart uniquement**. Le cahier des charges (section 8) demande un mode hors ligne riche (formations telechargees, prieres, derniers evenements) - migrer vers Workbox ou Serwist pour une gestion de cache granulaire par type de contenu.
- Ne jamais presenter une donnee mise en cache hors ligne comme definitive : afficher la date de derniere synchronisation cote UI.

## 9. IA (si un LLM est integre dans l'app)

- Cle API du fournisseur IA : **cote serveur uniquement** (`apps/api`), jamais dans `apps/web`.
- Sanitiser les entrees utilisateur avant de les inclure dans un prompt (prompt injection).
- Ne jamais envoyer de PII a un LLM externe sans anonymisation prealable.
- Toute reponse generee par IA et utilisee comme contenu pastoral doit passer par le workflow de validation standard (`ContentStatus.PENDING_VALIDATION`) - cf cahier des charges section 10.2 ("contenus generes ou reformules par IA").

## 10. Avant chaque mise en production

- [ ] Tous les secrets par defaut (`change_me_*`) remplaces par de vraies valeurs generees (`openssl rand -base64 64`) et stockees dans un secrets manager.
- [ ] `NODE_ENV=production`, `CORS_ORIGINS` restreint au(x) domaine(s) reel(s).
- [ ] MFA active pour les comptes `admin`/`super_admin`/`safeguarding_officer`.
- [ ] Backups Postgres chiffres, automatiques, et restauration testee.
- [ ] Pentest ou scan OWASP ZAP execute sur l'environnement de staging.
- [ ] Politique de confidentialite et gestion des consentements publiees et accessibles.
