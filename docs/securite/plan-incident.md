# Plan de réponse aux incidents de sécurité

À relire et compléter par l'archevêché (noms, téléphones). À garder aussi hors ligne, imprimé.

## 1. Qui appeler

| Rôle | Personne | Contact |
|---|---|---|
| Responsable de l'incident (décide, coordonne) | Administrateur diocésain de la plateforme | ______ |
| Technique (site, base, application) | Développeur / prestataire | ______ |
| Protection des mineurs (si des données d'enfants ou des signalements sont touchés) | Responsable sécurité diocésain | ______ |
| Communication | Service communication de l'archevêché | ______ |

## 2. Reconnaître un incident

- Connexions inhabituelles au panneau d'administration, compte staff qui ne reconnaît pas une action (journal d'audit : Administration › Journal).
- Pic d'erreurs ou de trafic (alertes Vercel), nombreuses réponses 429, violations `[CSP]` inhabituelles dans les journaux Vercel.
- Alerte GitHub (secret poussé, dépendance vulnérable critique), alerte Supabase.
- Contenu modifié ou publié sans raison, signalement d'un fidèle.

## 3. Contenir (dans l'heure)

1. **Compte compromis** : Supabase › Authentication › Users › l'utilisateur › *Sign out* (révoque ses sessions) puis *Ban* ; retirer ses rôles (`profiles.role`, `parish_members`).
2. **Secret exposé** (clé, mot de passe) : le **révoquer et le régénérer** immédiatement, avant toute autre action :
   - clé `service_role` / JWT Supabase : Settings › API › *Roll* (déconnecte tout le monde) ;
   - compte de service Firebase : console Google Cloud › IAM › clés ;
   - variables Vercel / EAS : remplacer puis redéployer.
3. **Site attaqué** : Vercel › Firewall › *Attack Challenge Mode* ; bloquer les IP en cause.
4. **Contenu malveillant** : dépublier depuis l'administration ; au besoin revenir au déploiement précédent (Vercel › Deployments › *Promote*).

## 4. Évaluer

- Quelles données ? (comptes, démarches, dons, **enfants**, **signalements**), combien de personnes, depuis quand.
- Sources : journal d'audit (`audit_logs`), journaux Supabase (API, Auth), journaux Vercel. Conserver des copies (preuves).

## 5. Notifier

- **Autorité de protection des données** : dans les **72 heures** après la découverte si des données personnelles sont touchées (RGPD pour les personnes dans l'Union européenne ; autorité congolaise compétente).
- **Personnes concernées** : sans retard si le risque est élevé (données d'enfants, signalements, mots de passe) — message simple : ce qui s'est passé, les données touchées, ce que nous faisons, ce qu'elles doivent faire (changer leur mot de passe, activer la double authentification).
- **Parents** pour toute donnée d'enfant ; responsable de la protection des mineurs pour les signalements.

## 6. Corriger et tirer les leçons

- Corriger la cause (code, réglage, droits), ajouter un test (tests SQL `tests/sql`, CI).
- Rédiger un compte rendu daté : chronologie, cause, données, mesures, notifications faites.
- Mettre à jour ce plan et `docs/securite/checklist.md`.
