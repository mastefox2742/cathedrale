# Plateforme archidiocésaine d'évangélisation et de médiation

> Cahier des charges adapté au code existant, état de réalisation et mise en production.
> Projet : `cathedrale-sacre-coeur` · Archidiocèse de Brazzaville
> Dernière mise à jour : 26 septembre 2026
> Voir aussi : [architecture.md](architecture.md) · [guide-archeveche.md](guide-archeveche.md)

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

Au départ, la plateforme était celle **d'une seule paroisse** (la Cathédrale Sacré-Cœur). Le cœur du
chantier a été de la rendre **multi-paroisses** sans casser l'existant.

---

## 2. Décisions d'architecture

| Sujet | Cahier des charges initial | **Décision retenue** | Raison |
|-------|---------------------------|----------------------|--------|
| Front web | Next.js | **Vite + React 19 + React Router (existant)** | 38 pages déjà codées ; Next.js imposerait une réécriture complète sans bénéfice essentiel. Les 404 se règlent avec `vercel.json`. |
| Contrôle d'accès admin | Middleware Next.js | **`AdminGuard` côté client + RLS Supabase côté serveur** | La vraie sécurité est dans la base (RLS) ; le garde client ne sert qu'à l'affichage. |
| Mobile | Expo | **Expo (existant, `mobile/`)** | Inchangé |
| Base / Auth / Stockage / Fonctions | Supabase | **Supabase** | Inchangé |
| Notifications push | FCM via `send-notification` | **Inchangé**, avec ciblage paroisse / rôle / groupe | Firebase n'est utilisé que pour le jeton FCM côté navigateur |
| Hébergement | Vercel | **Vercel** + `vercel.json` (réécriture SPA) | |
| Schéma BDD | — | **Migrations versionnées** dans `mobile/supabase/migrations/` | Le schéma historique reste `mobile/supabase/schema.sql` ; les évolutions sont des fichiers datés |
| Rôles | Table unique | **Rôles globaux** (`profiles.role`) + **rôles paroissiaux** (`parish_members`) | Une personne peut être catéchiste dans une paroisse et membre d'une autre |

---

## 3. Périmètre fonctionnel et état de réalisation

Légende : ✅ fait · ⚠️ partiel · ❌ non fait · 🔌 dépend d'un service externe à contractualiser

### 3.1 Partie publique (site, PWA, app mobile)

| Fonction | État | Où |
|----------|------|----|
| Accueil : 4 portes d'entrée « Je découvre / Je veux me convertir / Approfondir / Prier » | ✅ | `/` |
| Accueil : flux vidéo « À la une » + prochain direct | ✅ | `/` |
| Accueil : actualités, liturgie, horaires de la paroisse choisie, aperçu de l'histoire | ✅ | `/` |
| Médiation / TV : directs, programme, replays, playlists, filtres par public, recherche par thème/intervenant | ✅ | `/tv` |
| Parcours de foi « Premiers pas », « Conversion & catéchuménat », « Approfondir » | ✅ | `/decouvrir-la-foi`, `/se-convertir`, `/approfondir` |
| Parcours : étapes, vidéo, quiz, appels à l'action, progression, attestation | ✅ | `/parcours/:slug` |
| Catéchèse enfants et jeunes : cours, modules, leçons, quiz, progression, attestation | ✅ | `/catechese` |
| Prier : Évangile du jour + méditation, liturgie des heures (AELF), chapelet du jour | ✅ | `/prier` |
| Mur de prière avec « Je prie pour cette intention » | ✅ | `/prier` |
| Neuvaines et retraites en ligne | ✅ | `/prier` (parcours de type neuvaine / retraite) |
| Groupes de prière et mouvements avec formulaire d'adhésion | ✅ | `/prier`, `/vie-spirituelle`, `/jeunesse` |
| Témoignages par catégorie, mise en avant des conversions | ✅ | `/temoignages`, `/se-convertir` |
| Médiathèque publique (photos, documents) | ✅ | `/tv` → onglet Médiathèque |
| Annuaire des paroisses, fiche, plan, « la plus proche de moi » | ✅ | `/paroisses`, `/paroisses/:slug` |
| Choix de la paroisse dans l'en-tête ; contenus filtrés par paroisse | ✅ | tout le site |
| Histoire de la Cathédrale et du Cardinal Biayenda | ✅ | `/histoire` |
| Histoire de l'archidiocèse | ⚠️ | Chronologie en place ; un texte dédié reste à fournir |
| Démarches pastorales + suivi par le demandeur connecté | ✅ | `/demarches`, profil |
| Dons : formulaire, enregistrement, instructions Mobile Money | ✅ | `/dons` |
| Dons : vrais numéros MTN / Airtel / IBAN | ❌ | **Numéros fictifs** dans `src/services/dons.ts` et `DonsPage.tsx` : à remplacer |
| Paiement carte CinetPay, Mobile Money automatique | 🔌 | Affiché « Bientôt disponible » ; contrat marchand nécessaire |
| Inscription avec paroisse principale, rejoindre d'autres paroisses | ✅ | `/inscription`, `/paroisses/:slug` |
| Profil : infos, paroisses, parcours, formations obligatoires, historique (dons, intentions, témoignages, démarches) | ✅ | `/profil` |
| Mot de passe oublié | ✅ | `/connexion` |
| PWA : installation, hors-ligne, notifications | ✅ | existant |
| Liens directs sans 404 | ✅ | `vercel.json` |
| App mobile : TV, parcours de foi, neuvaines, annuaire, paroisse choisie | ✅ | `mobile/` |
| App mobile : notifications push natives | 🔌 | Nécessite `expo-notifications` et la configuration Firebase Android/iOS |

### 3.2 Staff et administration

| Fonction | État | Où |
|----------|------|----|
| Périmètre de travail (une paroisse / tout l'archidiocèse) | ✅ | menu admin |
| Tableau de bord : fidèles, catéchistes, enfants, dons, demandes, témoignages, adhésions, signalements, vidéos et lectures, parcours | ✅ | `/admin` |
| Tableau comparatif par paroisse | ✅ | `/admin` (périmètre archidiocèse) |
| Temps de visionnage des vidéos | 🔌 | Nécessite l'API YouTube Analytics ; le site compte les lectures |
| Paroisses : créer, modifier, désactiver, horaires, nommer l'équipe | ✅ | `/admin/paroisses` |
| Utilisateurs : rôles archidiocésains, rôles paroissiaux visibles, activation, habilitation | ✅ | `/admin/utilisateurs` |
| Journal d'audit par paroisse | ✅ | `/admin/audit` |
| Programmes de catéchèse de référence (archidiocèse) et paroissiaux | ✅ | `/admin/catechisme`, selon le périmètre |
| Registre des catéchistes et formations obligatoires | ✅ | `/admin/registre` + parcours « formation du staff » |
| Médiation : directs, passage en replay, playlists, thèmes, intervenants, public, à la une | ✅ | `/admin/tv`, `/admin/evenements` |
| Parcours de foi : éditeur d'étapes, quiz, statistiques | ✅ | `/admin/parcours` |
| Demandes : démarches, intentions, témoignages, adhésions, signalements (statuts, filtres) | ✅ | pages admin correspondantes |
| Alerte des responsables à chaque nouvelle demande | ⚠️ | Compteurs « à traiter » sur le tableau de bord ; pas d'email automatique (fournisseur d'email à choisir) |
| Dons : liste, statuts, filtres, export CSV | ✅ | `/admin/dons` |
| Abonnés : liste, export CSV | ✅ | `/admin/abonnes` |
| Abonnés : envoi automatique email / WhatsApp | 🔌 | Fournisseur d'email / API WhatsApp Business à choisir |
| Notifications push : ciblage paroisse / rôle / groupe, historique | ✅ | `/admin/notifications` + fonction `send-notification` |
| Protection des mineurs : signalements, dossiers enfants, consentements, responsable diocésain | ✅ | existant, désormais par paroisse |

### 3.3 Sécurité

| Point | État |
|-------|------|
| Abonnés et jetons push lisibles et effaçables par n'importe qui | ✅ Corrigé (lot 0 + migration) |
| Isolation des données par paroisse (RLS) | ✅ Toutes les politiques réécrites |
| Brouillons visibles par le staff d'autres paroisses | ✅ Corrigé : `can_manage(parish_id)` |
| Contenu saisi dans l'admin affiché sans échappement (injection HTML) | ✅ Le nouveau rendu échappe le HTML (`src/components/Markdown.tsx`) |
| Totaux des projets de dons illisibles par le public | ✅ Fonction `collecte_projets()` |

---

## 4. Modèle de données (Supabase)

Principe : **on ajoute sans casser.** Chaque table existante reçoit un `parish_id` ; toutes les données
existantes sont rattachées à la Cathédrale ; `parish_id = null` signifie « contenu archidiocésain ».
La colonne a pour valeur par défaut la Cathédrale, pour que l'app mobile déjà installée continue de fonctionner.

### 4.1 Nouvelles tables

| Table | Colonnes principales |
|-------|----------------------|
| `archdioceses` | `id`, `nom`, `slug` |
| `parishes` | `archdiocese_id`, `nom`, `slug`, `description`, `cure`, `adresse`, `quartier`, `ville`, `latitude`, `longitude`, `telephone`, `email`, `whatsapp`, `horaires` (jsonb), `photo_url`, `actif` |
| `parish_members` | `user_id`, `parish_id`, `role`, `principale` · clé (`user_id`, `parish_id`, `role`) |
| `evangelization_paths` | `parish_id`, `type` (`decouvrir`, `conversion`, `approfondir`, `neuvaine`, `retraite`, `formation_staff`), `titre`, `slug`, `description`, `emoji`, `duree`, `obligatoire_pour`, `ordre`, `publie` |
| `path_steps` | `path_id`, `ordre`, `titre`, `contenu` (markdown), `video_url`, `quiz` (jsonb), `appel_action` |
| `user_path_progress` | `user_id`, `step_id`, `path_id`, `score`, `termine_le` |
| `live_events` | `parish_id`, `titre`, `description`, `url`, `debut`, `fin`, `statut`, `intervenant`, `theme`, `publie` |
| `playlists`, `playlist_items` | playlists de vidéos par public (`public_cible`) |
| `testimony_categories` | conversion, famille, jeunes, engagement, guérison, prière exaucée, vocation, autre |
| `groupe_adhesions` | `groupe_id`, `parish_id`, `user_id`, `nom`, `contact`, `message`, `statut` |

### 4.2 Tables existantes modifiées

| Table | Ajout |
|-------|-------|
| Toutes les tables de contenu et de demandes | `parish_id` |
| `dons`, `demandes_pastorales`, `temoignages`, `notification_tokens` | `user_id` (historique du profil, ciblage des notifications) |
| `temoignages` | `category_id`, `mis_en_avant` |
| `evenements` | `theme`, `intervenant`, `public_cible`, `vues`, `a_la_une` |
| `medias` | `publie` (médiathèque publique) |
| `prayer_intentions` | `nb_prieres` |
| `notifications_log` | `cible` |
| `profiles` | `telephone`, `avatar_url` ; `role` ne contient plus que les rôles archidiocésains |

### 4.3 Rôles

**Archidiocésains** (`profiles.role`) : `archeveque`, `admin`, `admin_diocesain`, `admin_evangelisation`,
`coordinateur_catechese_diocesain`, `responsable_media_diocesain`, `responsable_securite`.

**Paroissiaux** (`parish_members.role`) : `admin_paroisse`, `pretre`, `secretariat`, `tresorier`,
`coordinateur_catechese`, `catechiste`, `staff_media`, `redacteur`, `responsable_groupe`,
`animateur_jeunesse`, `responsable_liturgie`, `responsable_securite`, `parent`, `benevole`, `membre`.

Les anciens rôles paroissiaux stockés dans `profiles.role` sont déplacés vers la Cathédrale par la migration.

### 4.4 Fonctions de droits (RLS)

```sql
is_admin()                             -- archevêque, admin, admin diocésain
has_parish_role(p uuid, roles text[])  -- a l'un de ces rôles dans la paroisse p
can_manage(p uuid)                     -- gérer un contenu de la paroisse p (null = archidiocèse)
can_manage_dons(p)  can_protect(p)  can_signalement(p)
```

---

## 5. Pages et écrans

| Route web | Écran mobile | Contenu |
|-----------|--------------|---------|
| `/tv` | `TvScreen` | Direct en cours, prochains directs, playlists, replays |
| `/decouvrir-la-foi`, `/se-convertir`, `/approfondir` | `ParcoursListeScreen` | Parcours par public |
| `/parcours/:slug` (+ `/attestation`) | `ParcoursScreen` | Étapes, vidéo, quiz, appel à l'action, progression |
| `/prier` | `PrierHubScreen` | Liturgie du jour, heures, chapelet, mur de prière, neuvaines, groupes |
| `/paroisses`, `/paroisses/:slug` | `ParoissesScreen` | Annuaire, fiche, plan |
| `/inscription`, `/profil` | `ConnexionScreen` | Compte, paroisses, parcours, historique |
| `/admin/paroisses`, `/admin/parcours`, `/admin/tv`, `/admin/dons`, `/admin/abonnes`, `/admin/registre` | — | Nouvelles pages d'administration |

---

## 6. Réalisation

| Lot | Contenu | État |
|-----|---------|------|
| 0 | `vercel.json`, carte « Intentions », fermeture de l'accès public aux abonnés | ✅ |
| 1 | Migration multi-paroisses, rôles, RLS, index, profil créé à l'inscription | ✅ `mobile/supabase/migrations/20260926000000_plateforme_archidiocesaine.sql` |
| 2 | Inscription avec paroisse, profil, sélecteur de paroisse, droits par périmètre | ✅ |
| 3 | Paroisses (admin + annuaire + fiche), pages filtrées par paroisse | ✅ |
| 4 | Médiation / TV (directs, playlists, À la une) | ✅ |
| 5 | Parcours de foi + contenus exemples (en brouillon) | ✅ |
| 6 | Prier, témoignages catégorisés, adhésions | ✅ |
| 7 | Tableau de bord, notifications ciblées, dons, abonnés, registre | ✅ |
| 8 | Mobile, documentation, guide | ✅ (sauf notifications push natives 🔌) |

### Mise en production (dans cet ordre)

1. **Supabase → SQL Editor** : exécuter la dernière section de `mobile/supabase/schema.sql` (« Sécurité : fermeture de l'accès public… »), si ce n'est pas déjà fait.
2. **Supabase → SQL Editor** : exécuter `mobile/supabase/migrations/20260926000000_plateforme_archidiocesaine.sql`. Le script peut être rejoué sans risque.
3. **Redéployer la fonction** `send-notification` (Supabase → Edge Functions, ou `supabase functions deploy send-notification`).
4. **Pousser le code** sur GitHub : Vercel redéploie le site.
5. **Vérifier** : annuaire des paroisses, connexion admin, tableau de bord, publication d'un parcours d'exemple après relecture.
6. Publier une nouvelle version de l'app mobile (EAS).

### Tests à faire après la mise en production

- Créer un compte test par rôle (admin de paroisse, catéchiste, trésorier, membre) dans deux paroisses différentes, et vérifier que chacun ne voit que ce qui le concerne.
- S'inscrire en choisissant une paroisse, puis vérifier le profil créé et l'appartenance.
- Suivre un parcours jusqu'au bout, puis ouvrir l'attestation.
- Envoyer une notification ciblée sur un rôle.
- Vérifier le journal d'audit après quelques modifications.

### Hors périmètre (services externes)

- Paiement CinetPay et Mobile Money automatique (contrat marchand)
- Envoi des emails / messages WhatsApp aux abonnés, alertes email au staff (fournisseur à choisir)
- Notifications push natives de l'app mobile (configuration Firebase Android/iOS)
- Temps de visionnage des vidéos (API YouTube Analytics)
- Bible en lingala / kikongo / kitouba (textes sous licence)

---

## 7. Questions ouvertes

1. **Numéros de dons** : vrais numéros MTN, Airtel et IBAN de la paroisse ?
2. **Liste des paroisses** : nom, quartier, contacts et horaires des paroisses à créer au départ ?
3. **Contenus exemples** : relecture par un prêtre des six parcours préparés avant publication.
4. **Nom de la plateforme** : reste-t-elle « Cathédrale Sacré-Cœur » ou devient-elle un portail de l'archidiocèse (nom, domaine) ?
