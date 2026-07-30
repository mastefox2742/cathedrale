# Paroisse Saint Michel de la Base

Application web diocésaine pour la Paroisse Saint Michel de la Base (Congo).

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend** : Firebase (Firestore, Auth, Storage)
- **Déploiement** : Vercel

## Fonctionnalités

### Site public
- Accueil avec actualités, histoire de la paroisse et devise liturgique
- Liturgie du jour (lectures AELF en temps réel)
- Annonces avec carousel auto-défilant
- Catéchèse, Vie spirituelle, Horaires des messes

### Portail d'administration (`/admin`)
- Gestion des annonces (images, publication, épinglage)
- Gestion des homélies (texte + audio)
- Gestion des formations
- Médiathèque (photos, documents, audio, vidéos)

## Lancer le projet en local

```bash
npm install
npm run dev
```

Créer un fichier `.env.local` avec les variables Firebase :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
