# infra

Dossier reserve aux artefacts de deploiement production (non fournis dans ce
squelette, a construire selon l'hebergeur choisi) :

- `Dockerfile` pour `apps/api` (build multi-stage, utilisateur non-root,
  `npm ci --omit=dev` puis `prisma generate`).
- `Dockerfile` pour `apps/web` (build Next.js standalone).
- Manifests de deploiement (Kubernetes, Fly.io, Render, ECS...) selon la
  cible retenue.
- Configuration du secrets manager choisi (Doppler / AWS Secrets Manager /
  HashiCorp Vault) — voir `SECURITY.md` section 10.

`docker-compose.yml` a la racine du depot est reserve au developpement local
(Postgres + Redis) et ne doit pas etre utilise tel quel en production.
