# Plateforme de l'Archidiocèse de Brazzaville

Site, application installable (PWA) et application mobile de l'Archidiocèse de Brazzaville, autour de la Cathédrale Sacré-Cœur : évangélisation, médiation vidéo, catéchèse, prière et coordination des paroisses.

- Cahier des charges et état de réalisation : [docs/plateforme-archidiocesaine.md](docs/plateforme-archidiocesaine.md)
- Architecture technique : [docs/architecture.md](docs/architecture.md)
- Guide d'utilisation pour l'archevêché et les paroisses : [docs/guide-archeveche.md](docs/guide-archeveche.md)

## Stack

- **Web + PWA** : Next.js 16 (App Router) + React 19 + TypeScript
- **Middleware** : `src/proxy.ts` (protection de `/admin` côté serveur)
- **Mobile** : Expo 57 (dossier `mobile/`)
- **Backend** : Supabase (Postgres + RLS, Auth, Storage, Edge Functions)
- **Hébergement** : Vercel

## Lancer le projet en local

```bash
npm install
npm run dev
```

Le site s'ouvre sur http://localhost:3000. Fichier `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...            # notifications push du site uniquement
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

Les anciens noms `VITE_*` sont encore acceptés (voir `next.config.mjs`) : les variables déjà définies sur Vercel continuent de fonctionner.

## Base de données

1. `mobile/supabase/schema.sql` : schéma historique
2. `mobile/supabase/migrations/*.sql` : évolutions, à exécuter dans l'ordre (Supabase → SQL Editor, ou `supabase db push`)
3. Fonction Edge `mobile/supabase/functions/send-notification` : à redéployer après modification, avec le secret `FCM_SERVICE_ACCOUNT`

Le site doit être déployé **après** l'application des migrations.

## Tests de sécurité

`tests/sql/` rejoue le schéma et les migrations sur une base PostgreSQL **locale** de test, puis vérifie les droits de chaque rôle (61 vérifications : isolation des paroisses et des archidiocèses, trésorerie, protection des mineurs, parents, alertes…).

```bash
PGPORT=5432 PGUSER=postgres tests/sql/run.sh
```

Ne jamais lancer ces scripts sur la base de production.
