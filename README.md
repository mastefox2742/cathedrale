# Plateforme de l'Archidiocèse de Brazzaville

Site, application installable (PWA) et application mobile de l'Archidiocèse de Brazzaville, autour de la Cathédrale Sacré-Cœur : évangélisation, médiation vidéo, catéchèse, prière et coordination des paroisses.

- Cahier des charges et état d'avancement : [docs/plateforme-archidiocesaine.md](docs/plateforme-archidiocesaine.md)
- Architecture technique : [docs/architecture.md](docs/architecture.md)
- Guide d'utilisation pour l'archevêché et les paroisses : [docs/guide-archeveche.md](docs/guide-archeveche.md)
- Charte de protection des mineurs : [docs/charte-protection-mineurs.md](docs/charte-protection-mineurs.md)

## Stack

- **Web** : React 19 + TypeScript + Vite + React Router, PWA
- **Mobile** : Expo (dossier `mobile/`)
- **Backend** : Supabase (Postgres + RLS, Auth, Storage, Edge Functions)
- **Hébergement** : Vercel

## Lancer le projet en local

```bash
npm install
npm run dev
```

Créer un fichier `.env.local` :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_FIREBASE_API_KEY=...            # notifications push uniquement
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

## Base de données

1. `mobile/supabase/schema.sql` : schéma historique
2. `mobile/supabase/migrations/*.sql` : évolutions, à exécuter dans l'ordre (Supabase → SQL Editor, ou `supabase db push`)
3. Fonction Edge `mobile/supabase/functions/send-notification` : à redéployer après modification (`supabase functions deploy send-notification`), avec le secret `FCM_SERVICE_ACCOUNT`

Le site doit être déployé **après** l'application des migrations : il utilise les nouvelles tables et colonnes.
