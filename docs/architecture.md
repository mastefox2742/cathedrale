# Architecture — Plateforme de l'Archidiocèse de Brazzaville

> Mise à jour : 27 septembre 2026 · Cahier des charges : [plateforme-archidiocesaine.md](plateforme-archidiocesaine.md) · Guide : [guide-archeveche.md](guide-archeveche.md)

## Vision

Plateforme numérique unique de l'archidiocèse : évangélisation (parcours de foi, chaîne vidéo), formation (catéchèse, catéchuménat, formation du staff), prière, et coordination de toutes les paroisses.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Site web + PWA | **Next.js 16 (App Router)**, React 19, TypeScript ; manifest `src/app/manifest.ts`, service worker `public/sw.js` |
| Middleware | `src/proxy.ts` (nom du middleware depuis Next.js 16) : protège `/admin` côté serveur |
| Routes API | `src/app/api/aelf` (proxy AELF) · `src/app/api/v1/[ressource]` (API publique en lecture seule) |
| Mobile | Expo 57 (React Native), dossier `mobile/`, notifications `expo-notifications` |
| Base, authentification, fichiers | Supabase (Postgres + Row Level Security, Auth, Storage) ; session en cookies via `@supabase/ssr` |
| Fonctions serveur | Supabase Edge Function `send-notification` (FCM pour les navigateurs, service Expo pour les téléphones) |
| Hébergement | Vercel |

---

## Multi-archidiocèse et multi-paroisses

- Tables `archdioceses` → `parishes`. **Toutes les tables de contenu et de demandes portent `parish_id` et `archdiocese_id`.** L'`archdiocese_id` est renseigné automatiquement par un trigger à partir de la paroisse. Pour un contenu sans paroisse, c'est l'archidiocèse de la personne qui le crée.
- `parish_id = null` : contenu de l'archidiocèse, visible dans toutes ses paroisses.
- **Public** : le visiteur choisit sa paroisse (en-tête, annuaire, « la plus proche »). Il voit les contenus de cette paroisse et ceux de l'archidiocèse.
- **Admin** : le staff choisit un **périmètre** (une paroisse, ou « tout l'archidiocèse » pour les rôles diocésains). Les listes sont filtrées sur ce périmètre et les créations y sont rattachées.
- **L'isolation réelle est faite par la base (RLS)** : une paroisse ne lit ni ne modifie les données privées d'une autre, et un archidiocèse ne voit rien d'un autre.

## Rôles

| Niveau | Stockage | Rôles |
|--------|----------|-------|
| Plateforme | `profiles.role = 'admin'` | Administrateur de tous les archidiocèses |
| Archidiocèse | `profiles.role` + `profiles.archdiocese_id` | `archeveque`, `admin_diocesain` (tout l'archidiocèse) · `admin_evangelisation`, `coordinateur_catechese_diocesain`, `responsable_media_diocesain` (contenus archidiocésains ; le responsable média modère aussi les médias des paroisses) · `responsable_securite` (protection des mineurs) |
| Paroisse | `parish_members (user_id, parish_id, role)` | `admin_paroisse`, `pretre`, `secretariat`, `tresorier`, `coordinateur_catechese`, `catechiste`, `staff_media`, `redacteur`, `responsable_groupe`, `animateur_jeunesse`, `responsable_liturgie`, `responsable_securite` · `parent`, `benevole`, `membre` |

Fonctions SQL de droits (utilisées par toutes les politiques) :
- `is_admin_de(a)`, `has_global_role_de(roles, a)`, `has_parish_role(p, roles)` ;
- `can_manage(p, a)`, `can_moderer_media(p, a)`, `can_manage_dons(p, a)`, `can_protect(p, a)`, `can_signalement(p, a)`.

Côté site, `useDroits()` (`src/contexts/AuthContext.tsx`) calcule les rôles effectifs dans le périmètre admin. Dans l'app mobile, l'« Espace staff » s'appuie sur les mêmes rôles.

---

## Base de données

- Schéma historique : `mobile/supabase/schema.sql`
- Migrations : `mobile/supabase/migrations/20260926…` (multi-paroisses, parcours, médiation…) puis `20260927…` (archidiocèse partout, présences, suivi des enfants, chartes, alertes, visionnage, duplication, données personnelles)

| Domaine | Tables |
|---------|--------|
| Organisation | `archdioceses` (présentation, histoire), `parishes`, `parish_members`, `profiles`, `chartes` |
| Contenus | `annonces`, `homelies`, `evenements` (vidéos, vues, temps de visionnage), `medias`, `groupes`, `services_paroissiaux`, `projets_dons` |
| Médiation / TV | `live_events`, `playlists`, `playlist_items` |
| Évangélisation | `evangelization_paths`, `path_steps`, `user_path_progress` |
| Catéchèse | `formations_catechisme`, `cours`, `catechisme_modules`, `lecons`, `formation_progress`, `module_progress`, `seances_catechisme`, `presences`, `enfant_progress` |
| Demandes | `demandes_pastorales` (détails par type), `prayer_intentions`, `temoignages` (+ `testimony_categories`), `groupe_adhesions`, `dons`, `abonnements` |
| Protection des mineurs | `enfants` (compte parent), `consentements_parentaux`, `signalements` |
| Suivi | `alertes`, `alertes_lues`, `audit_logs`, `notifications_log`, `notification_tokens` |

Fonctions appelées par le site :
- **Statistiques** : `stats_tableau_de_bord`, `stats_par_paroisse`, `stats_parcours`, `registre_staff`.
- **Actions publiques sans ouvrir les tables** : `collecte_projets`, `incrementer_vue`, `ajouter_visionnage`, `prier_pour`, `s_abonner`, `enregistrer_jeton`, `suivre_demande`.
- **Compte du fidèle** : `rejoindre_paroisse`, `definir_paroisse_principale`, `maj_mon_profil`, `exporter_mes_donnees`, `supprimer_mon_compte`.
- **Administration** : `dupliquer_cours`, `dupliquer_parcours`.

## Tests

`tests/sql/run.sh` crée une base PostgreSQL locale, y rejoue le schéma et les migrations (avec une imitation minimale de l'environnement Supabase : `tests/sql/00_supabase_stub.sql`), puis exécute les tests de droits :
- `10_tests_rls.sql` : isolation des paroisses, trésorerie, protection des mineurs, pas d'élévation de privilèges ;
- `11_tests_complements.sql` : isolation entre archidiocèses, parents, présences, alertes, suivi sans compte, duplication, modération média, données personnelles.

Tout se déroule dans des transactions annulées.

---

## Structure du code web

```
src/
├── app/                    App Router
│   ├── (public)/           pages publiques (en-tête + pied de page)
│   ├── (imprimable)/       attestations
│   ├── admin/login/        connexion
│   ├── admin/(protege)/    administration (AdminGuard + AdminLayout)
│   ├── api/aelf/           proxy des textes liturgiques
│   ├── api/v1/[ressource]/ API publique en lecture seule
│   ├── layout.tsx          métadonnées, polices, fournisseurs
│   └── manifest.ts         PWA
├── proxy.ts                middleware Next.js (/admin)
├── views/                  contenu des pages (composants client)
├── components/             Header2, Footer2, VideoCard, LecteurVideo, Markdown, Quiz, admin/…
├── contexts/               AuthContext (useDroits), ParoisseContext
├── lib/navigation.tsx      aides de navigation sur next/navigation
└── services/               accès Supabase par domaine ; scope.ts = paroisse courante / périmètre admin
```

## API publique

`GET /api/v1/{paroisses|annonces|videos|directs|parcours|homelies}`
- paramètres : `?paroisse=<slug>`, `?type=` (parcours), `?limite=` (200 au maximum) ;
- renvoie du JSON avec CORS ouvert et un cache CDN de 5 minutes ;
- n'expose que des données publiées.
