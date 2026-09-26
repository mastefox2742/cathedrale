# Plateforme archidiocésaine d'évangélisation et de médiation

> Cahier des charges, état de réalisation et mise en production.
> Projet : `cathedrale-sacre-coeur` · Archidiocèse de Brazzaville · Mise à jour : 27 septembre 2026
> Voir aussi : [architecture.md](architecture.md) · [guide-archeveche.md](guide-archeveche.md)

---

## 1. Objectifs

| # | Objectif | Traduction dans la plateforme |
|---|----------|-------------------------------|
| 1 | **Évangélisation** | 4 portes d'entrée, parcours « Découvrir la foi » et « Se convertir », chaîne vidéo |
| 2 | **Formation** | Catéchèse enfants et jeunes, parcours « Approfondir », formation obligatoire du staff |
| 3 | **Vie ecclésiale** | Prière (liturgie, heures, chapelet, mur, neuvaines, retraites), groupes, démarches pastorales |
| 4 | **Coordination** | Multi-paroisses et multi-archidiocèse, rôles, statistiques, alertes, standards communs |

---

## 2. Stack (conforme au cahier des charges)

| Exigence | Réalisation |
|----------|-------------|
| Front : Next.js (site + PWA) | ✅ Next.js 16, App Router, manifest et service worker |
| Mobile : Expo | ✅ Expo 57, dossier `mobile/` |
| Backend : Supabase (Auth, Database, Storage, Functions) | ✅ |
| Hébergement Vercel, sans 404 sur les liens directs | ✅ Routage Next.js (plus besoin de `vercel.json`) |
| Middleware Next.js vérifiant le rôle avant `/admin` | ✅ `src/proxy.ts` (nom du middleware depuis Next.js 16) |
| Tables liées à `archdiocese_id` et `parish_id` | ✅ Toutes les tables, rattachement automatique |
| RLS : chaque paroisse ne voit que ses données, l'archidiocèse voit tout | ✅ Vérifié par 61 tests (`tests/sql`) |
| Index sur `parish_id`, `archdiocese_id`, `statut`, `created_at` | ✅ |
| Protection des données personnelles | ✅ Export et suppression du compte par l'utilisateur |
| API propres pour intégrations futures | ✅ `/api/v1` (lecture seule) |

---

## 3. État par fonctionnalité

Légende : ✅ fait · 🔌 dépend d'un service ou d'un contrat externe · 📝 contenu à fournir ou relire

### 3.1 Partie publique

| Fonction du cahier des charges | État |
|--------------------------------|------|
| Accueil : bandeau avec les 4 accès (découvrir, se convertir, approfondir, prier) | ✅ |
| Accueil : flux vidéo « À la une », actualités, liturgie AELF, horaires de la paroisse choisie, aperçu de l'histoire de l'archidiocèse | ✅ |
| Médiation / TV : directs, replays (date, thème, intervenant), playlists par public, filtres, YouTube et Facebook intégrés | ✅ |
| Parcours « Premiers pas », « Conversion & catéchuménat » (avec témoignages de convertis et appel à l'action), « Approfondir » (Bible, doctrine, vie spirituelle, engagements) | ✅ 📝 (contenus exemples en brouillon, à relire) |
| Suivi de progression, attestation | ✅ |
| Catéchèse : cours, modules, leçons, quiz, **progression par enfant**, attestation, espace catéchiste | ✅ |
| Prière : liturgie des heures, chapelet, Évangile du jour + méditation, intentions, mur de prière, groupes + adhésion, neuvaines, retraites en ligne | ✅ |
| Témoignages : catégories, validation, mise en avant des conversions | ✅ 📝 (3 exemples marqués [EXEMPLE], non publiés) |
| Médias & Lives : lives programmés en **calendrier**, médiathèque | ✅ |
| Annuaire des paroisses, fiche avec contacts, horaires, activités, annonces, vidéos, homélies | ✅ |
| Annonces archidiocésaines et paroissiales | ✅ |
| Histoire de l'archidiocèse (page dédiée) | ✅ 📝 (texte provisoire, modifiable dans l'admin) |
| Démarches : formulaires par type (baptême, mariage, funérailles, certificat…), suivi par le demandeur (profil ou référence + contact) | ✅ |
| Dons : formulaire, Mobile Money, IBAN | ✅ 📝 (**numéros MTN / Airtel / IBAN fictifs à remplacer**) |
| Dons : paiement carte CinetPay | 🔌 « Bientôt disponible », comme demandé |
| Inscription avec paroisse principale, autres paroisses, profil (infos, paroisses, progression, historique) | ✅ |
| PWA : installation, hors-ligne, notifications | ✅ |
| App mobile : TV, parcours, prière (chapelet, mur), témoignages par catégorie, annuaire, notifications push, espace staff | ✅ |

### 3.2 Staff et administration

| Fonction du cahier des charges | État |
|--------------------------------|------|
| Tableau de bord : fidèles, catéchistes, enfants, dons, intentions, témoignages, signalements, vues et **temps de visionnage**, présence en catéchèse ; comparaison par paroisse | ✅ |
| Paroisses : créer, modifier, désactiver, assigner l'équipe | ✅ |
| Utilisateurs, rôles archidiocésains et paroissiaux, journal d'audit (qui, quoi, quand, où) | ✅ |
| Standards : programmes de référence (copiables par les paroisses), charte média, charte de protection des mineurs, annonces globales | ✅ 📝 (chartes en brouillon, à adopter) |
| Catéchèse : programmes modèles et locaux, stats par paroisse, groupes, catéchistes, enfants, **présences**, formation obligatoire, certification, registre | ✅ |
| Médiation : chaîne, playlists (y compris vidéos de l'archidiocèse dans les playlists de paroisse), directs, replays, **modération centrale** | ✅ |
| Parcours de foi : éditeur d'étapes et de quiz, statistiques | ✅ |
| Demandes : tri, filtres, statuts, **alertes aux responsables** | ✅ |
| Notifications push : ciblage tous / paroisse / rôle / groupe, historique | ✅ |
| Dons : liste, statuts, export | ✅ |
| Protection des mineurs : signalement anonyme, responsable diocésain, formation obligatoire | ✅ |

### 3.3 Ce qui reste hors du code

| Point | Pourquoi |
|-------|----------|
| Paiement CinetPay, Mobile Money automatique | Contrat marchand et clés à obtenir |
| Envoi d'emails / WhatsApp aux abonnés | Fournisseur à choisir (liste exportable dès maintenant) |
| Vidéos d'exemple dans les playlists | Liens de vidéos réelles à fournir par l'équipe média |
| Bible en lingala / kikongo / kitouba | Textes sous licence |

---

## 4. Étapes de la procédure du cahier des charges

| Étape | État |
|-------|------|
| 0. Préparation, analyse des écarts | ✅ |
| 1. Modélisation des données, RLS, index | ✅ 2 migrations, testées sur PostgreSQL 17 |
| 2. Authentification et rôles, middleware | ✅ |
| 3. Backend / API | ✅ RPC Supabase + `/api/v1` |
| 4. Frontend public | ✅ |
| 5. Admin & staff | ✅ |
| 6. PWA & mobile | ✅ (build EAS à lancer) |
| 7. Contenus exemples & tests | ✅ contenus en brouillon · 61 tests de droits automatisés |
| 8. Déploiement & documentation | ⏳ documentation faite ; déploiement : voir ci-dessous |

## 5. Mise en production (dans cet ordre)

1. **Supabase → SQL Editor** : exécuter, dans l'ordre :
   1. la dernière section de `mobile/supabase/schema.sql` (« Sécurité : fermeture de l'accès public… ») ;
   2. `mobile/supabase/migrations/20260926000000_plateforme_archidiocesaine.sql` ;
   3. `mobile/supabase/migrations/20260927000000_cahier_des_charges_complet.sql` ;
   4. `mobile/supabase/migrations/20260928000000_temoignages_gloire.sql` (compteur « Gloire à Dieu » des témoignages).
2. **Redéployer la fonction** `send-notification`.
3. **Pousser le code** sur GitHub : Vercel reconstruit le site en Next.js.
   - Les variables `VITE_*` existantes restent acceptées.
   - Chaque personne devra se reconnecter une fois, car la session est désormais stockée dans des cookies.
4. **App mobile** : `eas build`. Les onglets suivent les maquettes Archidiocèse : Accueil · TV / Média · Parcours · Prier · Plus. Les notifications Android nécessitent les identifiants FCM dans EAS (`eas credentials`).
5. **Relire, puis publier** les contenus en brouillon (parcours, chartes, histoire, témoignages d'exemple à remplacer).
6. **Remplacer** les numéros de dons fictifs.

## 6. Questions ouvertes

1. Vrais numéros MTN, Airtel et IBAN.
2. Liste des paroisses à créer (nom, quartier, contacts, horaires, coordonnées GPS).
3. Relecture pastorale des parcours, des chartes et de l'histoire de l'archidiocèse.
4. Nom et domaine définitifs de la plateforme.
