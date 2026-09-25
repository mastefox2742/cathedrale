# Plateforme archidiocésaine d'évangélisation et de médiation

> Cahier des charges adapté au code existant + analyse des écarts + plan de réalisation.
> Projet : `cathedrale-sacre-coeur` · Archidiocèse de Brazzaville
> Dernière mise à jour : 26 septembre 2026

---

## 1. Contexte et objectifs

L'archevêque souhaite une plateforme numérique unique pour tout l'archidiocèse, inspirée de KTO :
annoncer l'Évangile aux croyants comme aux non-croyants, former (catéchèse enfants, jeunes, adultes,
catéchumènes), faire vivre la prière, et coordonner toutes les paroisses.

| # | Objectif | Ce que ça veut dire concrètement |
|---|----------|----------------------------------|
| 1 | **Évangélisation** | Contenus simples et inspirants pour non-pratiquants et non-croyants |
| 2 | **Formation** | Parcours de catéchèse et de formation pour tous âges et niveaux |
| 3 | **Vie ecclésiale** | Prière, sacrements, groupes, mouvements |
| 4 | **Coordination** | Vue globale de l'archidiocèse, standards communs, rapports fiables |

La plateforme actuelle est celle **d'une seule paroisse** (la Cathédrale Sacré-Cœur). Le cœur du
chantier est de la rendre **multi-paroisses** sans casser ce qui existe.

---

## 2. Décisions d'architecture

| Sujet | Cahier des charges initial | **Décision retenue** | Raison |
|-------|---------------------------|----------------------|--------|
| Front web | Next.js | **Vite + React 19 + React Router (existant)** | 38 pages déjà codées ; Next.js imposerait une réécriture complète sans bénéfice essentiel. Les 404 se règlent avec `vercel.json`. |
| Contrôle d'accès admin | Middleware Next.js | **`AdminGuard` côté client + RLS Supabase côté serveur** | La vraie sécurité est dans la base (RLS) ; le garde client ne sert qu'à l'affichage. |
| Mobile | Expo | **Expo (existant, `mobile/`)** | Inchangé |
| Base / Auth / Stockage / Fonctions | Supabase | **Supabase** | Inchangé |
| Notifications push | FCM via `send-notification` | **Inchangé** | Firebase n'est utilisé que pour le jeton FCM côté navigateur |
| Hébergement | Vercel | **Vercel** + `vercel.json` (réécriture SPA) | |
| Schéma BDD | — | **Migrations versionnées** dans `supabase/migrations/` | Aujourd'hui tout est dans un seul `mobile/supabase/schema.sql` rejoué à la main |

> ⚠️ Le `README.md` mentionne encore Firebase (Firestore/Auth) comme backend : il est obsolète et
> sera corrigé dans le lot 8.

---

## 3. Périmètre fonctionnel et état actuel

Légende : ✅ fait · ⚠️ partiel · ❌ à faire

### 3.1 Partie publique (site, PWA, app mobile)

| Fonction | État | Détail / écart |
|----------|------|----------------|
| **Accueil** – actualités, liturgie, horaires, histoire | ✅ | |
| Accueil – 4 portes d'entrée « Je découvre la foi / Je veux me convertir / Approfondir / Prier » | ❌ | |
| Accueil – flux vidéo « À la une » | ❌ | |
| Accueil – horaires selon la paroisse choisie ou géolocalisée | ❌ | Dépend du multi-paroisses |
| **Médiation / TV** (`/tv`) – directs, replays, playlists, filtres par public | ⚠️ | `/evenements` liste des vidéos YouTube/Facebook ; pas de playlists, thèmes, intervenants, calendrier des directs |
| **Parcours de foi** « Premiers pas », « Conversion & catéchuménat », « Approfondir » | ❌ | Réutiliser le moteur de la catéchèse (cours → modules → leçons → quiz) |
| **Catéchèse** – cours, modules, leçons, quiz, progression, attestation | ✅ | Progression par compte ; pas encore « par enfant » côté parent |
| Catéchèse – espace catéchiste, séances, présences | ✅ | |
| **Prière** – liturgie du jour, intentions, groupes | ✅ | |
| Prière – mur de prière public | ⚠️ | Intentions publiques lisibles en base, pas de page « mur » dédiée |
| Prière – liturgie des heures, chapelet, neuvaines, retraites en ligne | ❌ | |
| Prière – page unique `/prier` | ❌ | |
| **Témoignages** – soumission + modération | ✅ | |
| Témoignages – catégories (conversion, famille, jeunes, guérison…) | ❌ | Table `temoignages` sans catégorie |
| **Médiathèque** publique | ⚠️ | La table `medias` n'est lisible que par le staff |
| **Annuaire des paroisses** `/paroisses` + fiche `/paroisses/:slug` | ❌ | |
| **Annonces & Agenda** archidiocésaines + paroissiales | ⚠️ | Existe pour une seule paroisse |
| **Histoire** | ✅ | Cathédrale + Cardinal Biayenda ; histoire de l'archidiocèse à ajouter |
| **Démarches pastorales** – formulaire | ✅ | |
| Démarches – suivi par le demandeur | ❌ | Seul le staff voit le statut |
| **Dons** – formulaire + enregistrement | ✅ | |
| Dons – vrais numéros MTN / Airtel / IBAN | ❌ | **Numéros fictifs en production** (`src/services/dons.ts`) |
| Dons – paiement carte CinetPay | ❌ | Affiché « Bientôt disponible » |
| **Connexion** email + mot de passe | ✅ | |
| Inscription publique avec choix de paroisse | ❌ | |
| Profil – infos, paroisses, progression, historique (dons, intentions, témoignages) | ❌ | |
| **Abonnements** email / WhatsApp | ⚠️ | Inscriptions enregistrées, aucun envoi, pas de page admin |
| **PWA** – installation, hors-ligne, notifications | ✅ | |
| **App mobile Expo** – 17 écrans | ✅ | Manquent : TV, parcours de foi, prière unifiée, annuaire |
| Liens directs (`/histoire`, `/dons`…) | ❌ | **404 en production** : pas de `vercel.json` |

### 3.2 Staff et administration

| Fonction | État | Détail / écart |
|----------|------|----------------|
| Tableau de bord | ⚠️ | Chiffres d'une seule paroisse ; carte « Intentions » affiche « Bientôt disponible » à tort |
| KPI globaux (fidèles, catéchistes, enfants, dons, vues vidéo…) | ❌ | |
| **Gestion des paroisses** (créer, modifier, désactiver, nommer un `parish_admin`) | ❌ | |
| Utilisateurs et rôles | ⚠️ | 13 rôles, mais **un seul rôle par personne et sans paroisse** |
| Journal d'audit | ✅ | Sans `parish_id` |
| Catéchèse – programmes de référence archidiocésains + programmes paroissiaux | ❌ | Un seul niveau aujourd'hui |
| Catéchèse – statistiques par paroisse | ❌ | |
| Formation / certification / registre des catéchistes | ❌ | |
| Médiation – playlists, directs, émissions | ❌ | |
| Parcours de foi – édition + statistiques | ❌ | |
| Gestion des demandes (démarches, intentions, témoignages, signalements) avec statuts | ✅ | |
| Notification des responsables à chaque nouvelle demande | ❌ | |
| Dons – liste, statuts | ✅ | |
| Dons – export CSV | ❌ | |
| Notifications push – envoi | ✅ | Via la fonction Edge `send-notification` |
| Notifications – ciblage par paroisse / rôle / groupe + historique | ⚠️ | Table `notifications_log` existe ; ciblage par paroisse impossible |
| Protection des mineurs – signalement anonyme, rôle `responsable_securite`, consentements parentaux | ✅ | |
| Formations obligatoires staff (safeguarding) | ❌ | |

### 3.3 Sécurité – problèmes relevés dans le schéma actuel

| Gravité | Problème | Fichier |
|---------|----------|---------|
| 🔴 Haute | Table `abonnements` : **lecture et suppression publiques** (`using (true)`). N'importe qui peut récupérer tous les emails/téléphones des abonnés, ou les effacer. | `mobile/supabase/schema.sql` l. 359 et 363 |
| 🟠 Moyenne | Table `notification_tokens` : mise à jour et suppression publiques de n'importe quel jeton. | l. 379-381 |
| 🟡 Faible | Aucune isolation par paroisse (normal aujourd'hui, bloquant demain). | — |

---

## 4. Modèle de données cible (Supabase)

Principe : **on ajoute sans casser.** Chaque table existante reçoit un `parish_id` **nullable** ;
`parish_id = null` signifie « contenu archidiocésain » (visible partout). Toutes les données actuelles
sont rattachées à la paroisse « Cathédrale Sacré-Cœur » lors de la migration.

### 4.1 Nouvelles tables

| Table | Colonnes principales |
|-------|----------------------|
| `archdioceses` | `id`, `nom`, `slug`, `created_at` |
| `parishes` | `id`, `archdiocese_id`, `nom`, `slug` (unique), `adresse`, `quartier`, `latitude`, `longitude`, `telephone`, `email`, `horaires` (jsonb), `photo_url`, `description`, `actif`, `created_at` |
| `parish_members` | `user_id`, `parish_id`, `role`, `principale` (bool), `created_at` · PK (`user_id`, `parish_id`, `role`) |
| `evangelization_paths` | `id`, `parish_id` (null = archidiocèse), `type` (`decouvrir` \| `conversion` \| `approfondir`), `titre`, `slug`, `description`, `image_url`, `ordre`, `publie` |
| `path_steps` | `id`, `path_id`, `ordre`, `titre`, `contenu` (markdown), `video_url`, `quiz` (jsonb), `appel_action` (`parler_pretre` \| `commencer_parcours` \| `aucun`) |
| `user_path_progress` | `user_id`, `step_id`, `termine_le`, `score` |
| `live_events` | `id`, `parish_id`, `titre`, `description`, `url`, `debut`, `fin`, `statut` (`programme` \| `en_direct` \| `termine`), `playlist_id` |
| `playlists` | `id`, `parish_id`, `titre`, `slug`, `public_cible` (`decouvre` \| `baptise` \| `prier` \| `jeunes` \| `famille`), `ordre` |
| `playlist_items` | `playlist_id`, `evenement_id` \| `live_event_id`, `ordre` |
| `testimony_categories` | `id`, `slug`, `libelle`, `ordre` |

### 4.2 Tables existantes modifiées

| Table | Ajout |
|-------|-------|
| `annonces`, `homelies`, `evenements`, `formations`, `medias`, `cours`, `catechisme_modules`, `groupes`, `projets_dons`, `services_paroissiaux`, `seances_catechisme`, `enfants` | `parish_id uuid null references parishes` |
| `dons`, `demandes_pastorales`, `prayer_intentions`, `signalements`, `temoignages`, `abonnements`, `notification_tokens` | `parish_id` + `user_id` (quand connecté, pour l'historique du profil) |
| `temoignages` | `category_id` |
| `audit_logs`, `notifications_log` | `parish_id` |
| `evenements` | `theme`, `intervenant`, `public_cible` |
| `profiles` | `telephone`, `avatar_url` ; la colonne `role` devient le **rôle global** (`archeveque`, `admin_diocesain`, `admin_evangelisation`, `coordinateur_catechese_diocesain`, `responsable_media_diocesain`, `responsable_securite`) |

Index sur `parish_id`, `statut`/`publie`, `created_at` pour toutes les tables filtrées.

### 4.3 Rôles

**Globaux** (dans `profiles.role`) : `archeveque`, `admin_diocesain`, `admin_evangelisation`,
`coordinateur_catechese_diocesain`, `responsable_media_diocesain`, `responsable_securite`.

**Paroissiaux** (dans `parish_members.role`) : `admin_paroisse`, `pretre`, `secretariat`, `tresorier`,
`coordinateur_catechese`, `catechiste`, `staff_media`, `responsable_groupe`, `animateur_jeunesse`,
`responsable_liturgie`, `parent`, `benevole`, `membre`.

Les rôles actuels sont conservés et migrés : un `catechiste` aujourd'hui devient
`parish_members(role='catechiste', parish_id=<cathédrale>)`.

### 4.4 Fonctions RLS

```sql
is_diocesan_admin()                    -- rôle global d'administration
has_parish_role(p uuid, roles text[])  -- l'utilisateur a l'un de ces rôles dans la paroisse p
can_manage(p uuid)                     -- is_diocesan_admin() or has_parish_role(p, <rôles staff>)
```

Règle type pour un contenu :
- **lecture** : `publie = true or can_manage(parish_id)`
- **écriture** : `can_manage(parish_id)`, et `parish_id is null` réservé à `is_diocesan_admin()`

---

## 5. Pages et écrans à créer

| Route web | Écran mobile | Contenu |
|-----------|--------------|---------|
| `/tv` | `TvScreen` | Direct en cours, prochains directs, playlists, replays filtrables |
| `/decouvrir-la-foi`, `/se-convertir`, `/approfondir` | `ParcoursScreen` | Liste des parcours du type |
| `/parcours/:slug` | `ParcoursDetailScreen` | Étapes, vidéo, quiz, appel à l'action, progression |
| `/prier` | `PrierHubScreen` (existe) | Liturgie du jour, chapelet, mur de prière, groupes, neuvaines |
| `/paroisses` | `ParoissesScreen` | Annuaire + recherche + carte |
| `/paroisses/:slug` | `ParoisseScreen` (existe, à généraliser) | Fiche, horaires, annonces, activités |
| `/inscription` | `InscriptionScreen` | Création de compte + paroisse principale |
| `/profil` | `ProfilScreen` | Infos, paroisses, progression, historique |
| `/admin/paroisses` | — | CRUD paroisses + nomination des responsables |
| `/admin/parcours` | — | Éditeur de parcours de foi + statistiques |
| `/admin/tv` | — | Directs, playlists, émissions |
| `/admin/abonnes` | — | Liste et export des abonnés |

Toutes les pages existantes deviennent « conscientes de la paroisse » via un **sélecteur de paroisse**
dans l'en-tête (mémorisé dans le navigateur ; par défaut : Cathédrale Sacré-Cœur).

---

## 6. Plan de réalisation

Chaque lot se termine par : compilation OK, vérification dans le navigateur, commit.
**Les lots marqués 🔒 modifient la base de production : confirmation obligatoire avant exécution.**

### Lot 0 — Corrections immédiates
- [x] `vercel.json` : réécriture SPA (fin des 404 sur les liens directs)
- [ ] Carte « Intentions de prière » du tableau de bord reliée à `/admin/intentions`
- [ ] 🔒 Correction RLS `abonnements` et `notification_tokens`
- [ ] Remplacer les numéros MTN / Airtel / IBAN fictifs *(attend les vrais numéros)*

### Lot 1 — 🔒 Fondations multi-paroisses (base de données)
- [ ] Mettre en place `supabase/migrations/` (le schéma actuel devient la migration initiale)
- [ ] Tables `archdioceses`, `parishes`, `parish_members`
- [ ] Colonnes `parish_id` sur les tables existantes + rattachement des données à la Cathédrale
- [ ] Fonctions `is_diocesan_admin`, `has_parish_role`, `can_manage` et réécriture des politiques RLS
- [ ] Index
- [ ] Tests RLS : un compte par rôle, vérifier ce que chacun voit

### Lot 2 — Authentification, rôles, profil
- [ ] Page `/inscription` (paroisse principale) + trigger de création de `profiles` / `parish_members`
- [ ] `AuthContext` expose rôle global + rôles par paroisse ; `AdminGuard` s'appuie dessus
- [ ] Page `/profil`
- [ ] Sélecteur de paroisse dans l'en-tête

### Lot 3 — Paroisses
- [ ] `/admin/paroisses` (CRUD + nomination)
- [ ] `/paroisses` et `/paroisses/:slug`
- [ ] Filtrage par paroisse des annonces, horaires, homélies, groupes, événements

### Lot 4 — Médiation / TV
- [ ] Tables `live_events`, `playlists`, `playlist_items` + colonnes `theme`, `intervenant`, `public_cible`
- [ ] `/admin/tv`
- [ ] `/tv` + bloc « À la une » sur l'accueil

### Lot 5 — Parcours de foi
- [ ] Tables `evangelization_paths`, `path_steps`, `user_path_progress`
- [ ] `/admin/parcours`
- [ ] `/decouvrir-la-foi`, `/se-convertir`, `/approfondir`, `/parcours/:slug` + attestation
- [ ] Les 4 portes d'entrée sur l'accueil
- [ ] Contenus exemples : 1 parcours « Découvrir la foi », 1 parcours « Conversion »

### Lot 6 — Prière et témoignages
- [ ] Page `/prier` (mur de prière, chapelet, neuvaines)
- [ ] Catégories de témoignages + mise en avant des conversions

### Lot 7 — Tableau de bord archidiocésain et notifications
- [ ] KPI globaux et par paroisse
- [ ] Ciblage des notifications par paroisse / rôle / groupe + historique
- [ ] Alerte des responsables à chaque nouvelle demande
- [ ] Export CSV des dons ; page `/admin/abonnes`

### Lot 8 — Mobile, documentation, mise en production
- [ ] Écrans Expo manquants (TV, parcours, annuaire, profil)
- [ ] Mise à jour du `README.md` et de `docs/architecture.md`
- [ ] Guide pour l'archevêché : créer une paroisse, lancer un parcours, envoyer une notification

### Hors périmètre pour l'instant
- Paiement CinetPay et Mobile Money automatique (nécessite un contrat marchand)
- Envoi réel des messages email / WhatsApp aux abonnés (nécessite un fournisseur)
- Bible en lingala / kikongo / kitouba (nécessite des textes sous licence)
- Liturgie des heures complète (droits AELF à vérifier)

---

## 7. Questions ouvertes

1. **Numéros de dons** : vrais numéros MTN, Airtel et IBAN de la paroisse ?
2. **Liste des paroisses** : nom, quartier, contacts, horaires des paroisses à intégrer au départ ?
3. **Accès Supabase** : qui applique les migrations en production (toi via le dashboard, ou la CLI Supabase) ?
4. **Nom de la plateforme** : reste-t-elle « Cathédrale Sacré-Cœur » ou devient-elle un portail de l'archidiocèse (nom, domaine) ?
