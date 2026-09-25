# Architecture — Plateforme de l'Archidiocèse de Brazzaville

> Mise à jour : 26 septembre 2026 · Cahier des charges : [plateforme-archidiocesaine.md](plateforme-archidiocesaine.md) · Guide d'utilisation : [guide-archeveche.md](guide-archeveche.md)

## Vision

Plateforme numérique unique de l'archidiocèse : évangélisation (parcours de foi, chaîne vidéo), formation (catéchèse, catéchuménat, formation du staff), prière, et coordination de toutes les paroisses.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Site web + PWA | React 19 + TypeScript + Vite + React Router 7, `vite-plugin-pwa` |
| Mobile | Expo 57 (React Native), dossier `mobile/` |
| Base, authentification, fichiers | Supabase (Postgres + Row Level Security, Auth, Storage) |
| Fonctions serveur | Supabase Edge Function `send-notification` (push FCM) · Vercel Function `api/aelf.ts` (proxy AELF) |
| Notifications push | Firebase Cloud Messaging (jeton navigateur uniquement ; Firebase n'est pas utilisé comme base) |
| Hébergement | Vercel (`vercel.json` : réécriture SPA pour les liens directs) |

---

## Multi-paroisses

- **Archidiocèse → paroisses** : tables `archdioceses` et `parishes`.
- **Toutes les données** portent un `parish_id`. `parish_id = null` = contenu archidiocésain, visible dans toutes les paroisses.
- **Côté public**, le visiteur choisit sa paroisse (en-tête, annuaire ou « la plus proche »). Il voit les contenus de cette paroisse et ceux de l'archidiocèse. Le choix est mémorisé dans le navigateur (`src/services/scope.ts`, `src/contexts/ParoisseContext.tsx`), et sur le téléphone pour l'app mobile.
- **Côté admin**, le staff choisit un **périmètre** (une paroisse, ou « tout l'archidiocèse » pour les rôles diocésains). Les listes sont filtrées sur ce périmètre et les créations y sont rattachées.
- **L'isolation réelle se fait dans la base** (RLS) : une paroisse ne peut ni lire ni modifier les données privées d'une autre. Les filtres côté site servent seulement à l'affichage.

## Rôles

| Niveau | Stockage | Rôles |
|--------|----------|-------|
| Archidiocèse | `profiles.role` | `archeveque`, `admin`, `admin_diocesain` (voient et gèrent tout) · `admin_evangelisation`, `coordinateur_catechese_diocesain`, `responsable_media_diocesain` (contenus archidiocésains) · `responsable_securite` (protection des mineurs, toutes paroisses) |
| Paroisse | `parish_members (user_id, parish_id, role)` | `admin_paroisse`, `pretre`, `secretariat`, `tresorier`, `coordinateur_catechese`, `catechiste`, `staff_media`, `redacteur`, `responsable_groupe`, `animateur_jeunesse`, `responsable_liturgie`, `responsable_securite` (staff) · `parent`, `benevole`, `membre` (fidèles) |

Fonctions SQL de contrôle (utilisées par toutes les politiques RLS) : `is_admin()`, `is_staff()`, `has_parish_role(p, roles)`, `can_manage(p)`, `can_manage_dons(p)`, `can_protect(p)`, `can_signalement(p)`.

Côté site : `useDroits()` (`src/contexts/AuthContext.tsx`) calcule les rôles effectifs dans le périmètre admin courant. `AdminGuard` et le menu admin s'appuient dessus.

---

## Base de données

- Schéma historique : `mobile/supabase/schema.sql`
- Évolutions : `mobile/supabase/migrations/` (à exécuter dans l'ordre, après `schema.sql`)

| Domaine | Tables |
|---------|--------|
| Organisation | `archdioceses`, `parishes`, `parish_members`, `profiles` (créé automatiquement à l'inscription) |
| Contenus | `annonces`, `homelies`, `evenements` (vidéos), `medias`, `groupes`, `services_paroissiaux`, `projets_dons` |
| Médiation / TV | `live_events` (directs programmés), `playlists`, `playlist_items`, `evenements.vues` |
| Évangélisation | `evangelization_paths` (découvrir, conversion, approfondir, neuvaine, retraite, formation du staff), `path_steps`, `user_path_progress` |
| Catéchèse | `formations_catechisme`, `cours`, `catechisme_modules`, `lecons`, `formation_progress`, `module_progress`, `seances_catechisme` |
| Demandes des fidèles | `demandes_pastorales`, `prayer_intentions`, `temoignages` (+ `testimony_categories`), `groupe_adhesions`, `dons`, `abonnements` |
| Protection des mineurs | `enfants`, `consentements_parentaux`, `signalements` |
| Suivi | `audit_logs`, `notifications_log`, `notification_tokens` |

Fonctions appelées par le site : `stats_tableau_de_bord`, `stats_par_paroisse`, `stats_parcours`, `registre_staff`, `collecte_projets`, `incrementer_vue`, `prier_pour`, `s_abonner`, `enregistrer_jeton`, `rejoindre_paroisse`, `definir_paroisse_principale`, `maj_mon_profil`.

---

## Structure du code web

```
src/
├── components/
│   ├── admin/        AdminGuard, AdminLayout (périmètre + menu par rôle), ui.tsx (briques admin)
│   ├── layout/       Header2 (sélecteur de paroisse), Footer2, Layout2
│   ├── pwa/          Installation, hors-ligne, notifications
│   └── *.tsx         Quiz, Markdown (échappe le HTML), VideoCard, Attestation, AdhesionModal, ProfilSections
├── contexts/         AuthContext (profil, appartenances, useDroits), ParoisseContext
├── pages/            Pages publiques
│   └── admin/        Pages d'administration
└── services/         Accès Supabase par domaine (+ scope.ts : paroisse courante / périmètre admin)
```

## Routes publiques

| Route | Contenu |
|-------|---------|
| `/` | Accueil : 4 portes d'entrée, liturgie, annonces, « À la une » |
| `/decouvrir-la-foi`, `/se-convertir`, `/approfondir` | Parcours de foi par public |
| `/parcours/:slug`, `/parcours/:slug/attestation` | Étapes, quiz, progression, attestation |
| `/tv` | Directs, programme, playlists, replays, médiathèque (`/evenements` redirige ici) |
| `/prier` | Évangile, liturgie des heures, chapelet, mur de prière, neuvaines, groupes |
| `/paroisses`, `/paroisses/:slug` | Annuaire, fiche paroisse, plan |
| `/liturgie`, `/homelies`, `/annonces`, `/catechese`, `/catechese/:coursId`, `/vie-spirituelle`, `/jeunesse`, `/horaires`, `/histoire`, `/temoignages`, `/demarches`, `/dons`, `/abonnements`, `/signaler` | Pages existantes, filtrées par paroisse |
| `/connexion`, `/inscription`, `/profil` | Espace membre : paroisses, parcours, historique |

## Routes d'administration (`/admin`, protégées)

Tableau de bord · Paroisses · Notifications · Médiation / TV · Vidéos & Replays · Annonces · Homélies · Médiathèque · Témoignages · Parcours de foi · Catéchisme · Formations · Espace catéchiste · Registre du staff · Groupes & adhésions · Démarches · Intentions · Services paroissiaux · Abonnés · Dons reçus · Projets de dons · Suivi Parent-Enfant · Signalements · Utilisateurs & Rôles · Journaux d'audit.

Chaque entrée n'apparaît que pour les rôles concernés (voir `SECTIONS` dans `AdminLayout.tsx`).
