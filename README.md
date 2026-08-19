# Cathédrale Sacré-Cœur de Brazzaville — Plateforme pastorale

Maison numerique de la foi : informer, former, accompagner et rassembler.

Monorepo pnpm/Turborepo — **Next.js (React/TypeScript)** pour le frontend,
**NestJS (TypeScript)** pour l'API, **PostgreSQL/Prisma** pour la persistance.

## Stack

| Domaine | Choix |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript strict |
| Backend | NestJS 10, TypeScript strict |
| Base de donnees | PostgreSQL 16 + Prisma |
| Cache / sessions | Redis (blacklist JWT, rate limiting) |
| Validation | Zod, schemas **partages** entre frontend et backend (`packages/shared`) |
| Auth | JWT access (15 min, memoire client) + refresh token opaque (cookie HttpOnly, rotation) |
| Monorepo | pnpm workspaces + Turborepo |

Voir [`SECURITY.md`](./SECURITY.md) pour le detail des regles de securite
appliquees, et [`CLAUDE.md`](./CLAUDE.md) pour le brief destine a Claude Code.

## Structure

```text
apps/
  web/            Next.js — pages publiques (SEO/PWA), espace membre, espace admin
  api/             NestJS — API REST, Prisma, auth, RBAC, audit
packages/
  shared/         Types, enums, roles/permissions, schemas Zod partages
  config/         Configs ESLint et TypeScript partagees
infra/            (a completer) Dockerfiles de production, manifests de deploiement
.github/workflows/  CI (lint, typecheck, tests, audit dependances)
docker-compose.yml  Postgres + Redis pour le developpement local
legacy/           Ancienne app Vite + Firebase (reference fonctionnelle, non maintenue)
```

## Demarrage rapide

Prerequis : Node.js 20+, pnpm 9+, Docker (pour Postgres/Redis en local).

```bash
# 1. Installer les dependances
pnpm install

# 2. Lancer Postgres + Redis en local
cp .env.example .env
docker compose up -d

# 3. Configurer les variables d'environnement de chaque app
# -> apps/api utilise .env (pas .env.local) : le CLI Prisma ne lit que .env,
#    NestJS lit les deux mais .env reste le choix simple et coherent ici.
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# -> Editer apps/api/.env : generer de vrais secrets JWT avec
#    `openssl rand -base64 64` (ne jamais garder les valeurs "change_me_*").

# 4. Appliquer les migrations Prisma
pnpm db:migrate

# 5. Lancer le frontend et l'API en parallele
pnpm dev
```

- Frontend : http://localhost:3000
- API : http://localhost:4000/api/v1 (healthcheck : http://localhost:4000/health)
- Prisma Studio : `pnpm db:studio`

## Commandes utiles

```bash
pnpm lint          # ESLint sur tout le monorepo
pnpm typecheck      # tsc --noEmit sur tout le monorepo
pnpm test           # tests unitaires
pnpm test:e2e        # tests e2e (necessite Postgres/Redis lances)
pnpm build           # build de production (web + api)
pnpm audit           # audit des dependances (pnpm audit --audit-level=high)
```

## Principe produit central

> L'information paroissiale reste ouverte a tous. La formation, la
> participation et l'accompagnement deviennent personnalises grace au compte
> utilisateur.

Voir le cahier des charges fonctionnel complet dans
[`docs/cahier-des-charges.md`](./docs/cahier-des-charges.md) pour le detail
des modules (liturgie, annonces, homelies, academie de formation,
catechisme, jeunesse, groupes, evenements, mediatheque, notifications, dons,
etc.) et des priorites de developpement.

## Modules deja scaffolde comme pattern de reference

- **Auth** (`apps/api/src/modules/auth`) : inscription, connexion, refresh,
  logout, hachage Argon2id, JWT, blacklist Redis.
- **Annonces** (`apps/api/src/modules/announcements`) : CRUD minimal +
  workflow de statut, a repliquer pour les autres contenus editoriaux
  (homelies, formations, evenements...) decrits dans le cahier des charges.

Chaque nouveau module backend doit suivre le meme schema : DTO Zod partage
dans `packages/shared`, service Prisma, controller avec
`@RequirePermission()`, ecriture systematique dans `AuditLogService` pour
toute action sensible.
