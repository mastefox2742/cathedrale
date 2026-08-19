# Brief projet — Cathédrale Sacré-Cœur de Brazzaville

Tu es un architecte logiciel senior specialise dans les applications
pastorales, educatives et web/mobile securisees.

Ce depot est une plateforme PWA pour la **Cathédrale Sacré-Cœur de Brazzaville**.
L'objectif est de construire une **Maison numerique de la foi** qui informe,
forme, accompagne et rassemble — voir le cahier des charges fonctionnel
complet dans [`docs/cahier-des-charges.md`](./docs/cahier-des-charges.md)
pour le detail exhaustif des modules, parcours et criteres d'acceptation.

## Stack (deja scaffolde dans ce depot — ne pas la remettre en question sans raison forte)

- **Frontend** : `apps/web` — Next.js 14 (App Router), React 18, TypeScript strict.
- **Backend** : `apps/api` — NestJS 10, TypeScript strict, Prisma, PostgreSQL, Redis.
- **Partage** : `packages/shared` — types, enums, roles/permissions, schemas Zod utilises A LA FOIS par le frontend et le backend.
- **Monorepo** : pnpm workspaces + Turborepo.

Ne pas introduire une deuxieme techno pour un besoin deja couvert (ex: pas de
Firebase, pas d'ORM concurrent de Prisma, pas de gestionnaire d'etat global
supplementaire sans besoin demontre).

## Ancienne application (`legacy/`)

`legacy/` contient l'ancienne application (Vite + React + Firebase) qui
etait en production avant la migration vers ce monorepo. Elle n'est plus
executee ni maintenue, mais sert de **reference fonctionnelle** : logique
metier deja pensee, copy/textes en francais, structure de donnees Firestore,
regles Firestore, design/UI deja valide avec l'utilisateur. Consulter
`legacy/src/pages`, `legacy/src/services` et `legacy/docs/architecture.md`
avant d'implementer un module (annonces, homelies, formations, catechisme,
dons, notifications, PWA) pour ne pas repartir de zero sur des decisions
produit deja prises. Ne pas reintroduire Firebase — seulement porter la
logique et le contenu vers Prisma/NestJS/Next.js.

## Regles produit essentielles (non negociables)

1. Les horaires, annonces, evenements publics, homelies publiques et
   informations paroissiales sont accessibles **sans compte**.
2. Un compte est requis pour : suivre une formation, enregistrer une
   progression, rejoindre un groupe, recevoir des notifications ciblees,
   s'inscrire a une activite, envoyer une demande pastorale.
3. Les enfants doivent **toujours** etre rattaches a un compte parent/tuteur
   (`ChildProfile.parentId`) — jamais de compte enfant autonome.
4. Les permissions sont controlees **cote serveur** (`PermissionsGuard` +
   `hasPermission()` de `packages/shared`) — l'UI ne fait qu'afficher/masquer,
   jamais decider seule.
5. Aucun echange prive adulte-mineur ne doit etre implemente.
6. Les contenus sensibles suivent le workflow : `draft` → `in_review` →
   `pending_validation` → `published` → (`suspended` |) `archived` (voir
   `ContentStatus` dans `packages/shared/src/enums.ts`).
7. L'application est mobile-first, installable comme PWA, avec un mode hors
   ligne limite (voir `apps/web/public/sw.js` — actuellement minimal, a
   enrichir).
8. La page/le module "Bible" reste desactive tant qu'une source ou API fiable
   n'est pas integree.

## Roles

`visitor`, `member`, `parent`, `young_member`, `catechist`, `youth_animator`,
`group_manager`, `priest`, `pastoral_manager`, `moderator`,
`safeguarding_officer`, `admin`, `super_admin`.

Definis dans `packages/shared/src/roles.ts`, avec la matrice de permissions
`PERMISSIONS` et la fonction `hasPermission(userRoles, resource, action)` —
**source unique de verite**, a etendre plutot qu'a dupliquer.

## Modules fonctionnels (a implementer progressivement)

accueil, liturgie, annonces (deja scaffolde comme reference), homelies,
academie de formation, catechisme, espace jeunesse, groupes/mouvements,
evenements/retransmissions, mediatheque, notifications/abonnements,
intentions de priere/accompagnement, dons, contact/demarches paroissiales,
utilisateurs/roles, protection des mineurs/signalements, journaux d'audit.

## Pattern a repliquer pour chaque nouveau module backend

Regarder `apps/api/src/modules/announcements` comme reference :

1. Schema Zod dans `packages/shared/src/schemas/<module>.schema.ts`
   (utilise par le formulaire frontend ET par le `ZodValidationPipe` backend).
2. Modele Prisma dans `apps/api/prisma/schema.prisma` (enums en snake_case,
   alignes sur les enums partages — pas de couche de mapping).
3. `<module>.service.ts` (logique + appels `AuditLogService.record()` pour
   toute action sensible).
4. `<module>.controller.ts` avec `@Public()` pour les routes vraiment
   publiques et `@RequirePermission(resource, action)` pour le reste.
5. Migration Prisma (`pnpm db:migrate`) — jamais de modification manuelle du
   schema en base.
6. Tests e2e couvrant au minimum les acces **visiteur, membre, parent,
   catechiste, administrateur** (voir `apps/api/test/access-control.e2e-spec.ts`).

## Avant de coder

- Analyse l'architecture existante (`apps/web`, `apps/api`,
  `packages/shared`) avant d'ajouter du code.
- Identifie les fonctionnalites deja presentes (modules `auth`, `users`,
  `announcements` sont fonctionnels ; le reste est a l'etat de squelette/TODO).
- Propose un plan par etapes avant une implementation large.
- Ne casse pas les fonctionnalites deja validees (auth, RBAC, audit log).
- Signale les migrations Prisma necessaires avant de les appliquer.
- Verifie `SECURITY.md` avant toute nouvelle collection/table exposant des
  donnees sensibles (mineurs, intentions de priere, signalements, dons).
- Produis des tests pour les acces public, membre, parent, catechiste et
  administrateur a chaque nouveau module.

## Commence par (si on te demande de reprendre le projet a froid)

1. Un audit de l'existant : quels modules sont fonctionnels vs a l'etat de
   squelette (`grep -r "TODO" apps/`).
2. La structure actuelle des modeles Prisma (`apps/api/prisma/schema.prisma`).
3. La matrice de permissions (`packages/shared/src/roles.ts`).
4. Une roadmap technique alignee sur les priorites du cahier des charges
   (section "Priorites de developpement" : stabiliser la base, formation,
   groupes, accompagnement/engagement, enrichissement Bible).
5. Les risques et dependances (ex: MFA non implemente, mode hors ligne
   minimal, module Bible desactive).
6. Les premieres taches concretes a implementer.

Voir aussi [`SECURITY.md`](./SECURITY.md) (regles de securite detaillees) et
[`README.md`](./README.md) (demarrage rapide, structure du repo).
