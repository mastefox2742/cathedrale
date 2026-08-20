# Architecture — Cathédrale Sacré-Cœur de Brazzaville
> Document BMAD · Phase 3 · Plateforme Catéchisme

## Vision

Plateforme diocésaine numérique de référence pour l'Archidiocèse de Brazzaville — liturgie, formation catéchétique, annonces et vie paroissiale.

---

## Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | React 18 + TypeScript + Vite | Typage strict, build rapide, écosystème mature |
| Styles | Tailwind CSS v4 + CSS Variables | Design system cohérent, tokens liturgiques |
| Routing | React Router v6 | SPA avec navigation déclarative |
| Backend | Firebase (Firestore + Auth + Storage) | Temps réel, gratuit tier, règles de sécurité RLS |
| Déploiement | Vercel + GitHub CI/CD | Auto-deploy sur push, Edge Functions AELF |
| Mobile | Expo (React Native) | Partage logique Firebase avec le web |

---

## Structure des dossiers

```
src/
├── components/
│   ├── admin/          # Guards, Layout admin
│   ├── layout/         # TopBar, BottomNav, SideNav, Layout
│   └── ui/             # Badge, Button, Card (design system)
├── contexts/
│   └── AuthContext.tsx  # Firebase Auth state global
├── pages/
│   ├── admin/          # Dashboard, CRUD pages admin
│   └── *.tsx           # Pages publiques
├── services/           # Couche d'abstraction Firebase (migration-ready)
│   ├── firebase.ts     # Init Firebase
│   ├── auth.ts         # Auth + profils
│   ├── annonces.ts     # CRUD annonces
│   ├── homelies.ts     # CRUD homélies
│   ├── formations.ts   # CRUD formations
│   ├── medias.ts       # Upload + CRUD médias
│   ├── evenements.ts   # Lives YouTube/Facebook
│   └── catechisme.ts   # Cours + modules catéchisme
└── styles/
    └── tokens.css      # Design tokens (couleurs, typographie, espacement)
```

---

## Modèle de données Firestore

### Collections principales

```
annonces/         publie, epingle, tag, imageUrl, d, m, titre, desc
homelies/         publie, titre, predicateur, date, contenu, audioUrl
formations/       publie, titre, description, couleur, icone
medias/           type (photo|doc|audio|video), url, storagePath, categorie
evenements/       type (live|replay|evenement), platform, url, estEnLive
catechisme_cours/ niveau (1-4), titre, tranche, emoji, couleur, publie
catechisme_modules/ coursId, ordre, titre, emoji, contenu, activite, priere, quiz[]
users/            uid, email, nom, role (admin|redacteur|catechiste), actif
```

### Règles de sécurité

- **Lecture publique** : annonces publiées, homélies publiées, cours publiés
- **Écriture** : authentifié + rôle approprié
- **Admin** : accès total
- **Rédacteur** : annonces, homélies, événements
- **Catéchiste** : cours, modules

---

## Principes d'architecture (BMAD)

### 1. Séparation des préoccupations
Chaque `service/*.ts` expose une API propre — le composant ne touche jamais Firestore directement. Migration vers Supabase = modifier les services uniquement.

### 2. Contenu 100% admin-géré
Aucun contenu "hardcodé" dans les pages publiques. Tout passe par Firestore :
- Annonces → `annonces` collection
- Homélies → `homelies` collection
- Cours catéchisme → `catechisme_cours` + `catechisme_modules`

### 3. Offline-first (PWA - ALP-92)
Service Worker + Cache API pour liturgie et cours. Les fidèles en bas débit peuvent lire hors connexion.

### 4. Mobile-first
Breakpoint 1024px : BottomNav (mobile) / SideNav (desktop). Padding adaptatif via CSS variables.

---

## Routes

| Path | Page | Accès |
|------|------|-------|
| `/` | Accueil | Public |
| `/liturgie` | Liturgie AELF | Public |
| `/annonces` | Annonces | Public |
| `/evenements` | Médias & Lives | Public |
| `/catechese` | Catéchèse (liste cours) | Public |
| `/catechese/:coursId` | Cours + modules + quiz | Public |
| `/vie-spirituelle` | Formation spirituelle | Public |
| `/horaires` | Horaires & Contact | Public |
| `/admin` | Dashboard | Admin/Rédacteur |
| `/admin/annonces` | Gestion annonces | Admin/Rédacteur |
| `/admin/homelies` | Gestion homélies | Admin/Rédacteur |
| `/admin/formations` | Gestion formations | Admin/Catéchiste |
| `/admin/evenements` | Lives & Médias | Admin/Rédacteur |
| `/admin/catechisme` | Gestion cours | Admin/Catéchiste |
| `/admin/medias` | Médiathèque | Admin |

---

## Performance

- Lazy loading des pages (React.lazy + Suspense) — À implémenter
- Images Firebase Storage avec CDN
- AELF via Vercel Edge Function (proxy sans CORS)
- Bundle splitting Vite par route

---

## Prochaines phases

| Phase | Tickets | Description |
|-------|---------|-------------|
| 3 | ALP-77 à 81 | Parcours 1ère Communion, Confirmation, RICA, Quiz |
| 4 | ALP-92 | PWA — manifest + Service Worker |
| 5 | ALP-93 | Notifications push Firebase FCM |
| 6 | ALP-96 | Bible Lingala/Kikongo/Kitouba |
| 7 | ALP-100 | Dons Mobile Money |
