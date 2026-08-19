# Plateforme pastorale — Cathédrale Sacré-Cœur de Brazzaville

> **Note d'implémentation** : les sections 8 et 15 ci-dessous décrivent une
> architecture Firebase à titre indicatif. Le dépôt a en réalité été
> scaffoldé avec **Next.js + NestJS + PostgreSQL/Prisma + Redis** (voir
> [`../CLAUDE.md`](../CLAUDE.md) et [`../README.md`](../README.md)) — c'est
> cette stack qui fait foi pour le développement. Le reste du document
> (rôles, modules, règles produit, priorités) reste la référence produit.

## 1. Vision du projet

La plateforme ne doit pas être uniquement un site d'annonces. Elle doit devenir une **Maison numérique de la foi** pour la Cathédrale Sacré-Cœur de Brazzaville : un espace ouvert à tous pour s'informer, et un espace personnalisé pour se former, participer et être accompagné.

### Promesse

> Informer, former, accompagner et rassembler.

### Principes directeurs

- Les informations paroissiales publiques sont accessibles sans compte.
- Un compte est demandé uniquement pour les fonctions personnalisées ou nécessitant un suivi.
- La jeunesse est une priorité, mais la plateforme sert aussi les enfants, les parents, les catéchistes, les adultes et les responsables paroissiaux.
- Tout contenu doctrinal, catéchétique ou pastoral doit pouvoir être relu et validé par une personne habilitée.
- La protection des mineurs, la confidentialité et la modération sont des fonctions fondamentales, pas des ajouts ultérieurs.
- L'application doit être mobile-first, installable comme PWA et utilisable avec une connexion limitée.

---

## 2. Accès public et accès membre

### 2.1 Contenus accessibles sans compte

Tout visiteur doit pouvoir consulter :

- les horaires des messes et offices ;
- les annonces paroissiales publiques ;
- l'adresse, les contacts et les horaires d'accueil ;
- les homélies publiées ;
- les événements ouverts à tous ;
- les retransmissions en direct ;
- la prière ou le texte liturgique du jour ;
- les informations sur la paroisse ;
- les horaires de confession ;
- les informations urgentes ;
- les contenus publics de la médiathèque ;
- les informations générales sur le catéchisme et les formations ;
- les projets soutenus par les dons.

### 2.2 Fonctions nécessitant un compte

Le compte est nécessaire pour :

- suivre un parcours de formation ;
- enregistrer sa progression ;
- participer à un quiz ;
- s'inscrire à une formation ou à un événement ;
- rejoindre un groupe ;
- recevoir des notifications personnalisées ;
- s'abonner à WhatsApp ou à la newsletter ;
- enregistrer des favoris ;
- envoyer une intention de prière ou une demande d'accompagnement ;
- consulter ses inscriptions et attestations ;
- gérer son profil ;
- gérer un groupe ou publier du contenu selon ses droits.

### 2.3 Tableau d'accès

| Fonction | Visiteur | Membre | Responsable | Administrateur |
|---|---:|---:|---:|---:|
| Voir les horaires | Oui | Oui | Oui | Oui |
| Lire les annonces publiques | Oui | Oui | Oui | Oui |
| Voir les événements | Oui | Oui | Oui | Oui |
| Suivre une formation | Non | Oui | Oui | Oui |
| Passer un quiz | Non | Oui | Oui | Oui |
| Rejoindre un groupe | Non | Oui | Oui | Oui |
| Recevoir des notifications ciblées | Non | Oui | Oui | Oui |
| Gérer un groupe | Non | Non | Oui | Oui |
| Publier une homélie | Non | Non | Selon permission | Oui |
| Gérer les utilisateurs | Non | Non | Non | Oui |
| Voir les journaux d'audit | Non | Non | Non | Oui |

---

## 3. Navigation principale

### Menu public

- Accueil
- Horaires et liturgie
- Annonces
- Homélies
- Événements
- Formations
- Jeunesse
- Catéchisme
- Médiathèque
- Dons
- Contact

### Menu connecté

- Mon espace
- Ma progression
- Mes groupes
- Mes inscriptions
- Mes notifications
- Mes favoris
- Mon profil

### Menu administration

- Tableau de bord
- Annonces
- Liturgie
- Homélies
- Formations
- Catéchisme
- Jeunesse
- Événements et lives
- Groupes
- Médiathèque
- Notifications
- Abonnements
- Dons
- Utilisateurs et rôles
- Protection et signalements
- Paramètres
- Journaux d'audit

---

## 4. Page d'accueil

La page d'accueil doit être claire et rapide. Elle doit répondre immédiatement à ces questions :

- Que se passe-t-il aujourd'hui ?
- À quelle heure est la prochaine messe ?
- Quelle est l'annonce importante ?
- Comment puis-je me former ?
- Comment puis-je participer ?
- Comment puis-je contacter la paroisse ?

### Blocs recommandés

1. Message d'accueil de la paroisse.
2. Horaires de la prochaine messe et des offices.
3. Parole ou thème liturgique du jour.
4. Annonce prioritaire.
5. Prochain événement.
6. Accès rapide à la prière du jour.
7. Accès rapide à la formation jeunesse.
8. Bouton « Demander une prière ».
9. Bouton « Faire un don ».
10. Bouton « Rejoindre un groupe ».
11. Dernières homélies et vidéos.
12. Contact et localisation.

Prévoir une interface adaptée aux petits écrans, avec des actions importantes visibles sans parcourir une page trop longue.

---

## 5. Modules fonctionnels

## 5.1 Liturgie et vie spirituelle

### Fonctionnalités

- Afficher les horaires des messes.
- Afficher les horaires de confession.
- Afficher les offices et temps de prière.
- Afficher le calendrier liturgique.
- Afficher les lectures et textes disponibles.
- Afficher une prière ou une méditation du jour.
- Afficher les homélies associées à une date ou à une célébration.
- Permettre l'ajout aux favoris pour les utilisateurs connectés.
- Prévoir le remplacement ou la désactivation temporaire de la page Bible tant qu'une source fiable n'est pas intégrée.

### Données minimales d'un horaire

- titre ;
- type de célébration ;
- date ;
- heure de début ;
- heure de fin facultative ;
- lieu ;
- langue ;
- récurrence éventuelle ;
- statut publié ou brouillon ;
- note complémentaire.

### Règles

- Les horaires publiés sont publics.
- Les modifications importantes peuvent déclencher une notification.
- Les contenus externes doivent être utilisés conformément à leurs droits et conditions d'utilisation.

---

## 5.2 Annonces paroissiales

### Fonctionnalités

- Créer, modifier, publier et archiver une annonce.
- Définir une priorité : normale, importante ou urgente.
- Programmer la date de publication et d'expiration.
- Associer une image, un document ou un lien.
- Cibler une audience : tous, jeunes, parents, catéchistes, groupe spécifique.
- Ajouter un lieu, une date et un bouton d'inscription.
- Envoyer une notification après publication si nécessaire.
- Afficher les annonces épinglées en haut de la page.

### Statuts

- brouillon ;
- en attente de validation ;
- publié ;
- archivé ;
- rejeté.

### Validation

Un auteur peut créer une annonce. Un responsable autorisé doit pouvoir la valider avant publication si la paroisse active ce circuit.

---

## 5.3 Homélies et contenus pastoraux

### Fonctionnalités

- Publier une homélie écrite, audio ou vidéo.
- Associer l'homélie à une date, une célébration et un célébrant.
- Ajouter un résumé court.
- Ajouter des mots-clés.
- Permettre l'écoute en streaming et le téléchargement si autorisé.
- Afficher les contenus récents et les contenus populaires.
- Ajouter une transcription facultative.
- Permettre le partage du lien public.

### Champs

- titre ;
- type de contenu ;
- texte ou URL média ;
- miniature ;
- célébration ;
- auteur ou célébrant ;
- date ;
- durée ;
- statut ;
- visibilité ;
- droits d'utilisation.

---

## 5.4 Académie de formation

L'académie est le cœur pédagogique de la plateforme.

### Structure

```text
Formation
  └── Parcours
        └── Modules
              └── Leçons
                    ├── Texte
                    ├── Vidéo
                    ├── Audio
                    ├── Document
                    ├── Activité
                    └── Quiz
```

### Fonctionnalités

- Créer des formations et des parcours.
- Définir l'âge, le niveau et le public cible.
- Organiser les modules dans un ordre pédagogique.
- Ajouter des leçons de différents types.
- Définir une durée estimée.
- Ajouter des prérequis.
- Autoriser ou non l'accès sans inscription.
- Suivre la progression de l'utilisateur.
- Marquer une leçon comme terminée.
- Ajouter des quiz avec correction automatique.
- Définir un score minimal.
- Générer une attestation lorsque le parcours est terminé.
- Télécharger les contenus pour une consultation hors ligne.
- Publier une version et conserver l'historique des modifications.

### États d'une formation

- brouillon ;
- en révision ;
- en attente de validation ;
- publiée ;
- suspendue ;
- archivée.

### Parcours prioritaires

#### Parcours enfants

- Éveil à la Foi, 6–8 ans.
- Découverte de la prière.
- Les grandes histoires bibliques.
- Les sacrements expliqués aux enfants.

#### Parcours adolescents

- Grandir dans la foi.
- Qui est Jésus ?
- Lire et comprendre la Bible.
- Foi et vie quotidienne.
- Amitié, respect et responsabilité.
- Réseaux sociaux et discernement.

#### Parcours jeunes adultes

- Leadership chrétien.
- Discernement vocationnel.
- Engagement et service.
- Orientation et projet de vie.
- Foi, travail et entrepreneuriat.
- Préparation au mariage.

#### Parcours adultes et parents

- Accompagner la foi de son enfant.
- Redécouvrir les sacrements.
- Lire l'Évangile en famille.
- Construire une vie de prière.

### Exemple de parcours

**Je découvre Jésus**

1. Qui est Jésus ?
2. La Bible et la Parole de Dieu.
3. Prier simplement.
4. L'Église et la communauté.
5. Servir les autres.
6. Mon engagement personnel.

Chaque module peut contenir une vidéo, une leçon, une activité, un quiz et une prière.

---

## 5.5 Catéchisme

### Fonctionnalités administratives

- Créer les niveaux de catéchisme.
- Définir les années et périodes.
- Gérer les classes et les groupes.
- Inscrire un enfant avec son parent ou tuteur.
- Affecter un catéchiste.
- Gérer les présences.
- Suivre la progression pédagogique.
- Publier des documents pour les parents.
- Publier des fiches pour les catéchistes.
- Ajouter chants, images, activités et coloriages.
- Organiser les rencontres et évaluations.
- Générer des listes de présence.
- Exporter les données autorisées.

### Modèle parent-enfant

```text
Compte parent
  └── Profil enfant
        ├── Niveau de catéchisme
        ├── Groupe
        ├── Catéchiste
        ├── Progression
        ├── Présences
        └── Autorisations
```

Pour les enfants de 6 à 8 ans, le compte parent ou tuteur doit être le point de contrôle principal. L'application ne doit pas créer de communication privée non supervisée entre un adulte et un enfant.

---

## 5.6 Espace jeunesse

Créer une section « Maison numérique des jeunes » avec :

- formations adaptées par âge ;
- vidéos courtes ;
- podcasts ;
- témoignages ;
- calendrier des rencontres ;
- inscription aux activités ;
- défis spirituels ;
- quiz ;
- projets de service ;
- bénévolat ;
- vocation et discernement ;
- leadership et prise de parole ;
- citoyenneté et responsabilité ;
- culture numérique ;
- orientation scolaire et professionnelle ;
- entrepreneuriat ;
- gestion des émotions et prévention des addictions.

### Tableau de bord du jeune

- parcours actuel ;
- prochaine leçon ;
- progression ;
- prochain rendez-vous ;
- groupe rejoint ;
- activités à venir ;
- favoris ;
- badges ou attestations ;
- actions de service ;
- demande d'accompagnement.

Les badges doivent encourager la régularité, l'apprentissage et le service. Ils ne doivent pas transformer la foi en compétition.

---

## 5.7 Groupes et mouvements

### Exemples de groupes

- groupes de jeunes ;
- catéchisme ;
- chorale ;
- servants d'autel ;
- lecteurs ;
- groupes bibliques ;
- associations paroissiales ;
- mouvements de familles ;
- bénévoles ;
- équipes liturgiques.

### Fonctionnalités

- Créer un groupe.
- Définir son responsable.
- Ajouter des membres.
- Définir la visibilité du groupe.
- Publier des annonces internes.
- Créer des événements propres au groupe.
- Gérer les présences.
- Envoyer des notifications ciblées.
- Partager des documents.
- Produire un compte rendu.
- Demander l'adhésion à un groupe.
- Valider ou refuser une demande d'adhésion.

### Sécurité

Les groupes de mineurs doivent avoir au moins un responsable identifié et un cadre de modération. Les échanges doivent rester traçables et respecter les règles de protection des mineurs.

---

## 5.8 Événements et retransmissions

### Fonctionnalités

- Créer une messe, formation, retraite, conférence, réunion ou activité.
- Ajouter date, heure, lieu, description et responsable.
- Ajouter une image et des documents.
- Activer l'inscription.
- Limiter le nombre de participants.
- Gérer une liste d'attente.
- Envoyer des rappels.
- Ajouter un lien de direct.
- Afficher le replay après l'événement.
- Exporter la liste des participants.

### Types d'événement

- liturgie ;
- formation ;
- jeunesse ;
- catéchisme ;
- famille ;
- social ;
- réunion ;
- direct vidéo ;
- campagne de solidarité.

---

## 5.9 Médiathèque

### Types de médias

- audio ;
- vidéo ;
- image ;
- PDF ;
- partition ;
- fiche pédagogique ;
- présentation ;
- podcast ;
- replay.

### Fonctionnalités

- Téléverser un fichier.
- Ajouter titre, description, auteur et catégories.
- Définir la visibilité.
- Associer le fichier à une leçon ou un événement.
- Ajouter une miniature.
- Contrôler la taille et le type du fichier.
- Rechercher par mot-clé.
- Télécharger ou écouter en ligne.
- Marquer un média comme réservé à un groupe.
- Conserver les informations de droits d'utilisation.

---

## 5.10 Notifications et abonnements

### Canaux

- notifications push FCM ;
- email ;
- WhatsApp lorsque l'intégration est disponible ;
- notification interne dans l'application.

### Segmentation

- tous les fidèles ;
- jeunes ;
- parents ;
- catéchistes ;
- responsables ;
- membres d'un groupe ;
- participants à un événement ;
- utilisateurs d'une zone ou chapelle.

### Fonctionnalités

- Créer une notification.
- Choisir un canal.
- Choisir une audience.
- Programmer l'envoi.
- Définir le niveau d'urgence.
- Suivre les envois et erreurs.
- Permettre à l'utilisateur de gérer ses préférences.
- Éviter les envois excessifs.

### Préférences utilisateur

```text
annonces_generales: true
horaires_modifies: true
formations: true
jeunesse: false
evenements: true
priere_du_jour: true
marketing: false
```

Les notifications urgentes doivent être réservées aux informations réellement importantes.

---

## 5.11 Intentions de prière et accompagnement

### Fonctionnalités

- Formulaire d'intention de prière.
- Choix entre demande publique, privée ou anonyme.
- Possibilité de demander une réponse.
- Attribution à un responsable habilité.
- Statut : reçue, en traitement, traitée, archivée.
- Historique limité aux personnes autorisées.
- Bouton de signalement.
- Suppression automatique ou archivage selon la politique définie.

### Données sensibles

Les intentions de prière peuvent contenir des informations personnelles ou sensibles. Il faut limiter les accès, protéger les données et expliquer clairement leur utilisation.

---

## 5.12 Dons et soutien

### Fonctionnalités

- Dons ponctuels.
- Dons réguliers si le prestataire le permet.
- Choix du projet soutenu.
- Montant libre ou montants prédéfinis.
- Paiement Mobile Money.
- Confirmation de paiement.
- Reçu ou preuve de transaction.
- Historique pour l'utilisateur connecté.
- Tableau de suivi pour l'administrateur.
- Statistiques agrégées.

### Projets possibles

- soutien aux jeunes ;
- catéchisme ;
- aide aux familles ;
- travaux de la paroisse ;
- œuvres sociales ;
- équipement audiovisuel ;
- formation des catéchistes.

Ne jamais stocker inutilement les informations bancaires ou les secrets de paiement dans Firestore. Utiliser le prestataire de paiement et vérifier les transactions côté serveur.

---

## 5.13 Contact et démarches paroissiales

Prévoir des formulaires pour :

- demande de baptême ;
- inscription au catéchisme ;
- mariage ;
- obsèques ;
- certificat ;
- intention de messe ;
- demande de prière ;
- accompagnement pastoral ;
- bénévolat ;
- demande d'information générale.

Chaque formulaire doit avoir :

- une confirmation de réception ;
- un identifiant de suivi ;
- un responsable assigné ;
- un statut ;
- une date limite de traitement ;
- une protection anti-spam ;
- une politique de conservation des données.

---

## 6. Rôles et permissions

### Rôles recommandés

- `visitor`
- `member`
- `parent`
- `young_member`
- `catechist`
- `youth_animator`
- `group_manager`
- `priest`
- `pastoral_manager`
- `moderator`
- `safeguarding_officer`
- `admin`
- `super_admin`

### Règles

- Un utilisateur peut avoir plusieurs rôles.
- Les permissions doivent être vérifiées côté serveur et dans les règles Firestore.
- L'interface ne doit jamais être le seul mécanisme de sécurité.
- Appliquer le principe du moindre privilège.
- Toutes les actions sensibles doivent être journalisées.
- Un responsable de groupe ne doit voir que les données nécessaires à son groupe.
- Les demandes pastorales doivent être accessibles uniquement aux responsables autorisés.

### Exemple de permission

```json
{
  "resource": "formation",
  "action": "publish",
  "allowedRoles": ["pastoral_manager", "priest", "admin"]
}
```

---

## 7. Protection des mineurs et confidentialité

Cette section est obligatoire avant l'ouverture des fonctionnalités sociales ou du catéchisme en ligne.

### Mesures minimales

- Consentement parental ou tutélaire pour les profils d'enfants.
- Collecte minimale des données.
- Profils d'enfants non publics.
- Pas de messagerie privée adulte-mineur.
- Modération des commentaires et contenus.
- Bouton de signalement visible.
- Procédure interne de traitement des signalements.
- Historique des actions d'administration.
- Limitation des téléchargements de photos d'enfants.
- Autorisation explicite pour photos et vidéos.
- Politique de confidentialité accessible.
- Suppression ou anonymisation des comptes.
- Contrôle des accès par rôle.
- Sauvegardes et plan de restauration.

Ne pas lancer un forum public ou une messagerie générale avant d'avoir conçu et validé ces règles.

---

## 8. Architecture technique recommandée

### Frontend

- PWA responsive mobile-first.
- Interface publique optimisée pour le référencement.
- Espace connecté séparé.
- Tableau de bord d'administration.
- Design simple, accessible et adapté aux connexions lentes.
- Gestion des états de chargement, erreurs et absence de connexion.

### Backend et services

- Firebase Authentication.
- Firestore pour les données structurées.
- Firebase Storage pour les fichiers.
- Cloud Functions pour les opérations sensibles.
- Firebase Cloud Messaging pour les notifications push.
- Analytics respectueux de la vie privée.
- Système de logs et d'audit.

### PWA et hors ligne

Mettre hors ligne :

- shell de l'application ;
- horaires récemment consultés ;
- formations téléchargées ou marquées hors ligne ;
- prières et contenus de base ;
- derniers événements consultés.

Ne pas considérer comme définitive une donnée mise en cache hors ligne. Afficher la date de dernière synchronisation.

### États réseau

Prévoir :

- mode en ligne ;
- mode hors ligne ;
- synchronisation en cours ;
- synchronisation réussie ;
- conflit de données ;
- échec de synchronisation.

---

## 9. Collections Firestore proposées

```text
users
roles
parishes
chapels
liturgical_days
mass_schedules
announcements
homilies
formations
courses
modules
lessons
quizzes
quiz_questions
enrollments
progress
certificates
catechism_levels
catechism_classes
catechism_enrollments
attendance
groups
group_members
group_posts
events
event_registrations
livestreams
media
prayer_requests
pastoral_requests
notifications
notification_preferences
subscriptions
donations
safeguarding_reports
consents
audit_logs
settings
```

### Champs communs

Chaque contenu administrable devrait généralement posséder :

```json
{
  "status": "draft",
  "visibility": "public",
  "createdBy": "user_id",
  "updatedBy": "user_id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "publishedAt": null,
  "archivedAt": null
}
```

---

## 10. Workflow éditorial

### Création et publication

1. Un auteur crée un contenu.
2. Le contenu est enregistré comme brouillon.
3. L'auteur l'envoie en révision.
4. Un responsable vérifie le contenu.
5. Le responsable publie, demande une correction ou rejette.
6. Le contenu publié peut être archivé ou mis à jour.
7. L'historique des versions est conservé.

### Contenus nécessitant une validation

- enseignements doctrinaux ;
- parcours catéchétiques ;
- messages officiels ;
- homélies ;
- annonces sensibles ;
- contenus concernant les mineurs ;
- communications de crise ;
- contenus générés ou reformulés par IA.

---

## 11. Tableau de bord administrateur

### Indicateurs

- nombre de visiteurs ;
- utilisateurs inscrits ;
- jeunes inscrits ;
- enfants inscrits au catéchisme ;
- formations actives ;
- taux de progression ;
- événements à venir ;
- inscriptions récentes ;
- notifications envoyées ;
- demandes pastorales en attente ;
- dons par projet ;
- signalements en attente.

### Actions rapides

- publier une annonce ;
- ajouter un horaire ;
- créer un événement ;
- publier une homélie ;
- créer un cours ;
- envoyer une notification ;
- traiter une demande ;
- consulter les signalements.

Les statistiques impliquant des mineurs doivent être limitées, agrégées et utilisées uniquement à des fins pastorales et administratives légitimes.

---

## 12. Priorités de développement

### Priorité 1 — Stabiliser la base existante

- finaliser l'espace public ;
- vérifier les horaires et annonces ;
- stabiliser le CMS ;
- finaliser la PWA ;
- vérifier les notifications ;
- vérifier les paiements ;
- mettre en place les rôles et permissions ;
- ajouter les journaux d'audit ;
- documenter les règles Firestore.

### Priorité 2 — Construire la formation

- modèles formation, module et leçon ;
- progression utilisateur ;
- quiz ;
- tableau de bord ;
- espace catéchiste ;
- catéchisme Niveau 1 ;
- gestion parent-enfant.

### Priorité 3 — Construire les groupes

- groupes de jeunes ;
- groupes de catéchisme ;
- responsables ;
- inscriptions ;
- annonces internes ;
- présences ;
- événements de groupe.

### Priorité 4 — Accompagnement et engagement

- intentions de prière ;
- demandes pastorales ;
- bénévolat ;
- dons par projet ;
- témoignages modérés ;
- répertoire des services paroissiaux.

### Priorité 5 — Bible et enrichissement

- intégrer une API ou une source autorisée ;
- lier les textes aux dates liturgiques ;
- ajouter recherche, favoris et historique ;
- ajouter les contenus audio et multilingues.

---

## 13. User stories essentielles

### Visiteur

- En tant que visiteur, je peux voir l'horaire de la prochaine messe sans créer de compte.
- En tant que visiteur, je peux consulter les annonces et événements publics.
- En tant que visiteur, je peux trouver l'adresse et les moyens de contact de la paroisse.

### Membre

- En tant que membre, je peux créer un compte avec email ou téléphone.
- En tant que membre, je peux choisir mes préférences de notification.
- En tant que membre, je peux m'inscrire à une formation.
- En tant que membre, je peux reprendre une leçon là où je me suis arrêté.
- En tant que membre, je peux m'inscrire à un événement.

### Parent

- En tant que parent, je peux inscrire mon enfant au catéchisme.
- En tant que parent, je peux consulter la progression de mon enfant.
- En tant que parent, je peux consulter les informations de son groupe.
- En tant que parent, je peux gérer les autorisations nécessaires.

### Catéchiste

- En tant que catéchiste, je peux consulter les contenus approuvés.
- En tant que catéchiste, je peux gérer les présences de mon groupe.
- En tant que catéchiste, je peux transmettre une annonce à mon groupe.
- En tant que catéchiste, je peux proposer un contenu à valider.

### Administrateur

- En tant qu'administrateur, je peux créer, modifier, publier et archiver les contenus.
- En tant qu'administrateur, je peux attribuer des rôles.
- En tant qu'administrateur, je peux envoyer une notification ciblée.
- En tant qu'administrateur, je peux consulter l'historique des actions sensibles.
- En tant qu'administrateur, je peux traiter les signalements et demandes reçues.

---

## 14. Critères d'acceptation généraux

### Public

- Une personne peut consulter les horaires sans compte.
- Les pages publiques sont accessibles sur mobile.
- Les contenus sont partageables par lien.
- Les pages importantes disposent d'un titre, d'une description et d'une URL stable.

### Authentification

- L'inscription demande uniquement les données nécessaires.
- L'utilisateur peut réinitialiser son mot de passe.
- L'utilisateur peut supprimer son compte ou demander la suppression de ses données.
- Les permissions sont vérifiées côté serveur.

### Formation

- Un cours peut être créé sans code.
- Un administrateur peut publier ou dépublier un cours.
- La progression est sauvegardée.
- Un utilisateur hors ligne voit les contenus déjà téléchargés.
- Un quiz affiche le résultat selon les règles configurées.

### Notifications

- L'utilisateur peut se désabonner des catégories non essentielles.
- Les notifications respectent l'audience choisie.
- Les erreurs d'envoi sont visibles dans l'administration.

### Sécurité

- Les données sensibles ne sont pas publiques.
- Un responsable ne voit que les ressources de son périmètre.
- Les actions administratives importantes sont journalisées.
- Les signalements sont accessibles uniquement aux responsables habilités.

---

## 15. Prompt de démarrage pour Claude Code

Utiliser le prompt suivant comme point de départ :

```text
Tu es un architecte logiciel senior spécialisé dans les applications pastorales, éducatives et Firebase.

Je construis une plateforme PWA pour la Cathédrale Sacré-Cœur de Brazzaville.
L'objectif est de créer une Maison numérique de la foi qui informe, forme, accompagne et rassemble.

Règles produit essentielles :
1. Les horaires, annonces, événements publics, homélies publiques et informations paroissiales sont accessibles sans compte.
2. Un compte est requis pour suivre une formation, enregistrer une progression, rejoindre un groupe, recevoir des notifications ciblées, s'inscrire à une activité ou envoyer une demande pastorale.
3. Les enfants doivent être rattachés à un compte parent ou tuteur.
4. Les permissions doivent être contrôlées côté serveur et avec les règles Firestore.
5. Aucun échange privé adulte-mineur ne doit être créé.
6. Les contenus importants suivent un workflow brouillon, révision, validation, publication et archivage.
7. L'application est mobile-first, installable comme PWA et compatible avec un mode hors ligne limité.
8. La page Bible reste désactivée tant qu'une source ou API autorisée n'est pas intégrée.

Rôles : visitor, member, parent, young_member, catechist, youth_animator, group_manager, priest, pastoral_manager, moderator, safeguarding_officer, admin, super_admin.

Modules : accueil, liturgie, annonces, homélies, formations, catéchisme, jeunesse, groupes, événements, lives, médiathèque, notifications, demandes de prière, démarches pastorales, dons, utilisateurs, sécurité et audit.

Avant de coder :
- analyse l'architecture existante ;
- identifie les fonctionnalités déjà présentes ;
- propose un plan par étapes ;
- ne casse pas les fonctionnalités validées ;
- signale les migrations nécessaires ;
- vérifie les règles de sécurité avant toute nouvelle collection ;
- produis des tests pour les accès public, membre, parent, catéchiste et administrateur.

Commence par me fournir :
1. un audit de la base existante ;
2. la structure des collections Firestore ;
3. la matrice des permissions ;
4. la roadmap technique ;
5. les risques et dépendances ;
6. les premières tâches à implémenter.
```

---

## 16. Définition du MVP final

Le MVP réellement utile doit permettre :

- la consultation publique des horaires et annonces ;
- la gestion complète des contenus par l'administration ;
- la création d'un compte membre ;
- l'inscription à un parcours ;
- le suivi de progression ;
- le catéchisme Niveau 1 ;
- la gestion parent-enfant ;
- la création de groupes ;
- l'inscription aux événements ;
- les notifications ciblées ;
- les demandes de prière ;
- les dons Mobile Money ;
- la PWA et un mode hors ligne limité ;
- les permissions, la modération et les journaux d'audit.

La règle principale à conserver est la suivante :

> **L'information paroissiale reste ouverte à tous. La formation, la participation et l'accompagnement deviennent personnalisés grâce au compte utilisateur.**
