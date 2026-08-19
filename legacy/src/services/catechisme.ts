import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Types ────────────────────────────────────────────────────────────────────

export type NiveauType = 1 | 2 | 3 | 4  // 1=Éveil, 2=1ère Communion, 3=Confirmation, 4=RICA

export interface QuizQuestion {
  question: string
  reponses: string[]       // 4 choix
  bonneReponse: number     // index 0-3
  explication?: string
}

export interface Module {
  id?: string
  coursId: string
  ordre: number
  titre: string
  sousTitre?: string
  emoji: string
  contenu: string          // texte principal (markdown)
  activite?: string        // activité pratique
  priere: string           // prière de fin
  quiz: QuizQuestion[]     // 5 questions
  publie: boolean
  createdAt?: Timestamp
}

export interface Cours {
  id?: string
  niveau: NiveauType
  titre: string
  tranche: string          // "6 – 8 ans"
  description: string
  objectif: string
  emoji: string
  couleur: string          // accent color
  totalModules: number
  publie: boolean
  createdAt?: Timestamp
}

// ── Collections ──────────────────────────────────────────────────────────────

const COURS_COL = 'catechisme_cours'
const MODULES_COL = 'catechisme_modules'

// ── Cours ────────────────────────────────────────────────────────────────────

export async function getCours(): Promise<Cours[]> {
  const snap = await getDocs(query(
    collection(db, COURS_COL),
    where('publie', '==', true),
    orderBy('niveau'),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Cours))
}

export async function getCoursById(id: string): Promise<Cours | null> {
  const snap = await getDoc(doc(db, COURS_COL, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } as Cours : null
}

export async function addCours(data: Omit<Cours, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COURS_COL), { ...data, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateCours(id: string, data: Partial<Cours>): Promise<void> {
  await updateDoc(doc(db, COURS_COL, id), data)
}

// ── Modules ──────────────────────────────────────────────────────────────────

export async function getModules(coursId: string): Promise<Module[]> {
  const snap = await getDocs(query(
    collection(db, MODULES_COL),
    where('coursId', '==', coursId),
    where('publie', '==', true),
    orderBy('ordre'),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Module))
}

export async function getAllModules(coursId: string): Promise<Module[]> {
  const snap = await getDocs(query(
    collection(db, MODULES_COL),
    where('coursId', '==', coursId),
    orderBy('ordre'),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Module))
}

export async function addModule(data: Omit<Module, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, MODULES_COL), { ...data, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateModule(id: string, data: Partial<Module>): Promise<void> {
  await updateDoc(doc(db, MODULES_COL, id), data)
}

export async function deleteModule(id: string): Promise<void> {
  await deleteDoc(doc(db, MODULES_COL, id))
}

// ── Seed data — Éveil à la Foi ───────────────────────────────────────────────
// Données initiales à insérer une seule fois via l'admin

export const SEED_COURS_EVEIL: Omit<Cours, 'id' | 'createdAt'> = {
  niveau: 1,
  titre: 'Éveil à la Foi',
  tranche: '6 – 8 ans',
  description: 'Découverte de Dieu, de Jésus et de l\'Église à travers des histoires bibliques, des prières et des activités adaptées aux plus jeunes.',
  objectif: 'Aider l\'enfant à rencontrer Dieu comme un Père aimant et à découvrir Jésus comme son ami.',
  emoji: '🌿',
  couleur: '#2e7d32',
  totalModules: 8,
  publie: true,
}

export const SEED_MODULES_EVEIL: Omit<Module, 'id' | 'createdAt' | 'coursId'>[] = [
  {
    ordre: 1,
    titre: 'Qui est Dieu ?',
    sousTitre: 'Le Père qui nous aime',
    emoji: '☀️',
    contenu: `## Dieu est notre Père

Dieu est l'auteur de tout ce qui existe. Il a créé le ciel, la terre, les animaux, les plantes… et toi !

Mais sais-tu ce qui est le plus merveilleux ? **Dieu t'aime.** Il t'a créé parce qu'il voulait que tu existes. Tu es précieux à ses yeux.

### Dieu est comme un papa très aimant

Quand tu as peur, Dieu est là. Quand tu es triste, Dieu est là. Quand tu es joyeux, Dieu se réjouit avec toi.

Jésus nous a appris à appeler Dieu **"Notre Père"**. C'est le mot le plus beau que nous pouvons lui dire.

### La création nous parle de Dieu

Regarde le soleil qui réchauffe, les fleurs qui poussent, les étoiles la nuit… Tout cela nous dit que Dieu est grand et qu'il nous aime.

> *"Dieu vit tout ce qu'il avait fait, et voici, c'était très bon."* — Genèse 1:31`,
    activite: `**Activité : La création de Dieu**

Dessine ta chose préférée dans la création (un animal, une fleur, le ciel…) et écris en dessous : *"Merci Dieu de l'avoir créé !"*`,
    priere: `Seigneur Dieu, merci de m'avoir créé.
Merci pour le soleil, les fleurs et les animaux.
Aide-moi à te connaître de mieux en mieux.
Je t'aime, Papa du Ciel. Amen. 🙏`,
    quiz: [
      { question: 'Qui a créé le ciel et la terre ?', reponses: ['Les hommes', 'Dieu', 'Les anges', 'La nature'], bonneReponse: 1, explication: 'C\'est Dieu qui a tout créé ! La Bible nous le dit au premier chapitre.' },
      { question: 'Comment Jésus nous a appris à appeler Dieu ?', reponses: ['Mon roi', 'Mon maître', 'Notre Père', 'Mon créateur'], bonneReponse: 2, explication: 'Jésus nous dit d\'appeler Dieu "Notre Père" parce qu\'il nous aime comme un papa.' },
      { question: 'Qu\'est-ce que Dieu pensa de sa création ?', reponses: ['C\'était mauvais', 'C\'était ordinaire', 'C\'était très bon', 'C\'était insuffisant'], bonneReponse: 2, explication: 'La Bible dit : "Dieu vit tout ce qu\'il avait fait, et voici, c\'était très bon."' },
      { question: 'Pourquoi Dieu t\'a créé ?', reponses: ['Par hasard', 'Pour travailler', 'Parce qu\'il voulait que tu existes et t\'aime', 'Pour obéir'], bonneReponse: 2, explication: 'Dieu t\'a créé parce qu\'il t\'aime ! Tu es précieux à ses yeux.' },
      { question: 'Quand Dieu est-il avec toi ?', reponses: ['Seulement le dimanche', 'Seulement quand tu pries', 'Jamais', 'Toujours, même quand tu as peur'], bonneReponse: 3, explication: 'Dieu est toujours avec toi, dans la joie et dans la peine !' },
    ],
    publie: true,
  },
  {
    ordre: 2,
    titre: 'Jésus, Fils de Dieu',
    sousTitre: 'Notre ami et sauveur',
    emoji: '✝️',
    contenu: `## Jésus est venu nous rendre visite

Il y a 2 000 ans, Dieu a envoyé son Fils unique sur la terre. Ce Fils, c'est **Jésus**.

Jésus est né à Bethléem, d'une jeune femme qui s'appelait **Marie**. Son père sur la terre était **Joseph**, un charpentier.

### Jésus aime les enfants

Un jour, des mamans amenaient leurs enfants à Jésus. Les disciples voulaient les renvoyer. Mais Jésus dit :

> *"Laissez les petits enfants venir à moi, ne les empêchez pas ; car le royaume de Dieu est pour ceux qui leur ressemblent."* — Marc 10:14

Jésus t'aime tout particulièrement. Il a du temps pour toi !

### Ce que Jésus a fait

- Il a guéri des malades
- Il a nourri des milliers de personnes avec 5 pains et 2 poissons
- Il a calmé une tempête
- Il est mort sur la croix pour nos péchés
- Il est ressuscité le troisième jour !`,
    activite: `**Activité : Ma lettre à Jésus**

Écris une petite lettre à Jésus. Tu peux lui dire ce que tu aimes, ce que tu voudrais lui demander, ou simplement lui dire bonjour !`,
    priere: `Jésus, tu es mon ami.
Tu m'aimes comme les petits enfants que tu accueillais.
Merci d'être venu sur la terre pour moi.
Aide-moi à te ressembler chaque jour. Amen. ✝️`,
    quiz: [
      { question: 'Où Jésus est-il né ?', reponses: ['Nazareth', 'Jérusalem', 'Bethléem', 'Le Caire'], bonneReponse: 2, explication: 'Jésus est né à Bethléem, dans une étable, enveloppé de langes.' },
      { question: 'Comment s\'appelait la maman de Jésus ?', reponses: ['Élisabeth', 'Marie', 'Anne', 'Sara'], bonneReponse: 1, explication: 'Marie est la maman de Jésus. Elle a dit "oui" à Dieu avec beaucoup de courage.' },
      { question: 'Que dit Jésus des enfants ?', reponses: ['Ils doivent rester loin', 'Laissez-les venir à moi', 'Ils doivent d\'abord grandir', 'Ils ne comprennent pas'], bonneReponse: 1, explication: 'Jésus dit : "Laissez les petits enfants venir à moi" — il t\'aime !' },
      { question: 'Que s\'est-il passé 3 jours après la mort de Jésus ?', reponses: ['Rien de spécial', 'Il a disparu', 'Il est ressuscité', 'Il est parti en voyage'], bonneReponse: 2, explication: 'Jésus est ressuscité ! C\'est la grande nouvelle de Pâques.' },
      { question: 'Quel miracle Jésus a-t-il fait avec 5 pains et 2 poissons ?', reponses: ['Il les a vendus', 'Il a nourri des milliers de personnes', 'Il les a donnés à Marie', 'Il les a transformés en or'], bonneReponse: 1, explication: 'Jésus a nourri plus de 5 000 personnes avec seulement 5 pains et 2 poissons !' },
    ],
    publie: true,
  },
  {
    ordre: 3,
    titre: 'Le Saint-Esprit',
    sousTitre: 'L\'ami invisible de Dieu en nous',
    emoji: '🕊️',
    contenu: `## Le Saint-Esprit, le grand ami

Quand Jésus est monté au ciel, il n'a pas laissé ses amis seuls. Il leur a promis d'envoyer **le Saint-Esprit**.

Le Saint-Esprit, c'est Dieu lui-même qui vit **en nous**. On ne peut pas le voir, mais on peut ressentir sa présence.

### La Pentecôte

50 jours après Pâques, les apôtres priaient ensemble à Jérusalem. Tout à coup, un grand vent souffla et des flammes de feu apparurent au-dessus de leurs têtes.

C'était **le Saint-Esprit** qui venait les remplir de courage et d'amour !

### Les dons du Saint-Esprit

Le Saint-Esprit nous donne :
- **La sagesse** pour bien choisir
- **La force** pour faire le bien
- **La joie** même dans les difficultés
- **L'amour** pour aimer les autres

> *"L'Esprit Saint vous enseignera toutes choses."* — Jean 14:26`,
    activite: `**Activité : Les flammes du Saint-Esprit**

Dessine une flamme de feu et écris à l'intérieur un don que tu aimerais recevoir du Saint-Esprit (courage, joie, amour, sagesse…)`,
    priere: `Saint-Esprit, viens dans mon cœur.
Remplis-moi de ta joie et de ton amour.
Aide-moi à être courageux pour faire le bien.
Amen. 🕊️`,
    quiz: [
      { question: 'Qui est le Saint-Esprit ?', reponses: ['Un ange', 'Un prophète', 'Dieu lui-même qui vit en nous', 'Un ami de Jésus'], bonneReponse: 2, explication: 'Le Saint-Esprit c\'est Dieu lui-même ! Il vit dans le cœur de ceux qui croient.' },
      { question: 'Quand le Saint-Esprit est-il venu sur les apôtres ?', reponses: ['À Noël', 'À Pâques', 'À la Pentecôte', 'À l\'Épiphanie'], bonneReponse: 2, explication: 'C\'est à la Pentecôte, 50 jours après Pâques, que le Saint-Esprit est descendu sur les apôtres.' },
      { question: 'Sous quelle forme le Saint-Esprit est-il apparu à la Pentecôte ?', reponses: ['Une colombe et de l\'eau', 'Du vent et des flammes de feu', 'Un arc-en-ciel', 'Une étoile brillante'], bonneReponse: 1, explication: 'Un grand vent souffla et des flammes de feu apparurent — c\'était le Saint-Esprit !' },
      { question: 'Qu\'est-ce que le Saint-Esprit nous donne ?', reponses: ['De l\'argent', 'De la force et de la sagesse', 'Des jouets', 'De bonnes notes à l\'école'], bonneReponse: 1, explication: 'Le Saint-Esprit nous donne des dons spirituels : sagesse, force, joie, amour.' },
      { question: 'Peut-on voir le Saint-Esprit ?', reponses: ['Oui, il est blanc', 'Oui, il ressemble à une flamme', 'Non, mais on peut le ressentir', 'Oui, la nuit seulement'], bonneReponse: 2, explication: 'On ne peut pas voir le Saint-Esprit, mais on peut ressentir sa présence dans notre cœur.' },
    ],
    publie: true,
  },
  {
    ordre: 4,
    titre: 'La Prière',
    sousTitre: 'Parler avec Dieu',
    emoji: '🙏',
    contenu: `## La prière, c'est facile !

Prier, c'est simplement **parler avec Dieu**. Pas besoin de grands mots compliqués. Dieu entend même les pensées de ton cœur.

Tu peux prier :
- Le matin quand tu te réveilles
- Le soir avant de dormir
- Quand tu as peur
- Quand tu es heureux
- **N'importe quand !**

### Le Notre Père

Jésus nous a appris une prière très spéciale : **le Notre Père**. C'est la prière la plus importante des chrétiens.

> *Notre Père qui es aux cieux,
> que ton nom soit sanctifié,
> que ton règne vienne,
> que ta volonté soit faite sur la terre comme au ciel.
> Donne-nous aujourd'hui notre pain de ce jour.
> Pardonne-nous nos offenses,
> comme nous pardonnons à ceux qui nous ont offensés.
> Et ne nous laisse pas entrer en tentation,
> mais délivre-nous du mal. Amen.*

### Les types de prière

- **Merci** — remercier Dieu pour ses bienfaits
- **Pardon** — demander pardon quand on a mal agi
- **S'il te plaît** — demander de l'aide à Dieu
- **Louer** — dire à Dieu qu'il est grand et bon`,
    activite: `**Activité : Mon journal de prière**

Aujourd'hui, écris 3 prières courtes :
1. Une prière de **merci** pour quelque chose de beau dans ta vie
2. Une prière de **pardon** pour quelque chose qui ne t'a pas rendu fier
3. Une prière de **demande** pour quelqu'un que tu aimes`,
    priere: `Seigneur, tu m'écoutes toujours.
Merci d'être si proche de moi.
Apprends-moi à te parler chaque jour,
dans la joie et dans la peine. Amen. 🙏`,
    quiz: [
      { question: 'C\'est quoi prier ?', reponses: ['Lire la Bible uniquement', 'Parler avec Dieu', 'Aller à l\'église', 'Chanter des cantiques'], bonneReponse: 1, explication: 'Prier c\'est parler avec Dieu ! Tu peux lui parler à tout moment.' },
      { question: 'Quelle prière Jésus nous a-t-il enseignée ?', reponses: ['Le Je vous salue Marie', 'Le Notre Père', 'Le Credo', 'Le Magnificat'], bonneReponse: 1, explication: 'Jésus nous a appris le "Notre Père", la prière la plus importante des chrétiens.' },
      { question: 'Quand peut-on prier Dieu ?', reponses: ['Seulement le dimanche', 'Seulement le matin', 'N\'importe quand !', 'Seulement à l\'église'], bonneReponse: 2, explication: 'On peut prier Dieu à tout moment : le matin, le soir, quand on a peur ou quand on est heureux !' },
      { question: 'Comment commence le Notre Père ?', reponses: ['Dieu tout-puissant...', 'Notre Père qui es aux cieux...', 'Seigneur, écoute-moi...', 'Je crois en Dieu...'], bonneReponse: 1, explication: 'Le Notre Père commence par "Notre Père qui es aux cieux" — Jésus nous apprend à appeler Dieu notre Père.' },
      { question: 'Lequel n\'est PAS un type de prière ?', reponses: ['Prière de merci', 'Prière de pardon', 'Prière de punition', 'Prière de louange'], bonneReponse: 2, explication: 'On prie pour remercier, pardonner, demander et louer — mais pas pour punir !' },
    ],
    publie: true,
  },
  {
    ordre: 5,
    titre: 'La Messe',
    sousTitre: 'La grande famille de Jésus',
    emoji: '⛪',
    contenu: `## Qu'est-ce que la messe ?

La messe, c'est le moment où tous les chrétiens se réunissent pour **rencontrer Jésus ensemble**. C'est le repas de la famille de Dieu.

### Les grandes parties de la messe

**1. La Liturgie de la Parole**
On écoute des textes de la Bible. Le prêtre explique ce que Dieu veut nous dire aujourd'hui.

**2. La Liturgie eucharistique**
Le prêtre prend du pain et du vin. Il dit les paroles de Jésus :
> *"Ceci est mon corps... Ceci est mon sang."*

À ce moment-là, le pain devient vraiment **le Corps de Jésus**.

### Pourquoi aller à la messe ?

- Pour rencontrer Jésus
- Pour être avec la communauté chrétienne
- Pour recevoir la force de Dieu pour la semaine
- Pour remercier Dieu ensemble

### Les gestes à la messe

🤲 **Les mains ouvertes** — pour recevoir
🙇 **S'agenouiller** — pour adorer
✝️ **Le signe de croix** — pour commencer et finir`,
    activite: `**Activité : La messe en images**

Dessine l'intérieur d'une église avec : l'autel, la croix, les bancs, et les fidèles en prière. Montre que la messe est un moment joyeux !`,
    priere: `Jésus, merci pour la messe.
Merci de te donner à nous dans le pain et le vin.
Aide-moi à aller à la messe avec joie chaque dimanche.
Amen. ⛪`,
    quiz: [
      { question: 'Pourquoi va-t-on à la messe ?', reponses: ['Pour voir ses amis seulement', 'Pour rencontrer Jésus et prier ensemble', 'Parce qu\'on est obligé', 'Pour dormir'], bonneReponse: 1, explication: 'On va à la messe pour rencontrer Jésus, prier ensemble et recevoir sa force.' },
      { question: 'Qu\'est-ce que la Liturgie de la Parole ?', reponses: ['Le repas partagé', 'Le moment où on écoute la Bible', 'La quête', 'Le chant final'], bonneReponse: 1, explication: 'Dans la Liturgie de la Parole, on écoute des textes de la Bible et le prêtre les explique.' },
      { question: 'Que dit le prêtre sur le pain pendant la messe ?', reponses: ['Ce pain est bon pour la santé', 'Ceci est mon corps', 'Mangez ce pain avec joie', 'Ce pain vient du Congo'], bonneReponse: 1, explication: 'Le prêtre dit les paroles de Jésus : "Ceci est mon corps" — c\'est la consécration.' },
      { question: 'Que représente le signe de croix ?', reponses: ['Une salutation', 'Un geste pour commencer et finir la prière au nom de la Trinité', 'Un symbole de chance', 'Un exercice physique'], bonneReponse: 1, explication: 'Le signe de croix nous rappelle la Sainte Trinité et que Jésus est mort pour nous.' },
      { question: 'Quel jour les chrétiens vont-ils habituellement à la messe ?', reponses: ['Le lundi', 'Le vendredi', 'Le dimanche', 'Le mercredi'], bonneReponse: 2, explication: 'Le dimanche est le "jour du Seigneur" — le jour de la résurrection de Jésus.' },
    ],
    publie: true,
  },
  {
    ordre: 6,
    titre: 'Le Baptême',
    sousTitre: 'Je suis enfant de Dieu',
    emoji: '💧',
    contenu: `## Le Baptême : devenir enfant de Dieu

Le Baptême est le premier et le plus important des sacrements. C'est le jour où tu es devenu officiellement **enfant de Dieu**.

### Comment se passe le baptême ?

Le prêtre verse de l'eau sur ta tête en disant :
> *"Je te baptise au nom du Père, du Fils et du Saint-Esprit."*

L'eau symbolise :
- La **purification** — les péchés sont lavés
- La **vie nouvelle** — tu renaîtres comme enfant de Dieu

### Les symboles du baptême

💧 **L'eau** — purifie et donne la vie
🕯️ **La bougie** — Jésus est la lumière du monde
⚪ **Le vêtement blanc** — tu es pur aux yeux de Dieu
🛢️ **L'huile** — tu es consacré au service de Dieu

### Tes parrains et marraines

Le jour de ton baptême, tes **parrains et marraines** ont promis de t'aider à grandir dans la foi. Ils sont tes guides spirituels.`,
    activite: `**Activité : Mon arbre de baptême**

Dessine un arbre avec des racines et des branches. Dans les racines, écris le nom de ta famille. Dans les branches, écris les personnes qui t'aident à grandir dans la foi (parrains, catéchistes, prêtre…)`,
    priere: `Seigneur, merci pour mon baptême.
Ce jour-là, tu m'as adopté comme ton enfant.
Aide-moi à vivre comme un vrai enfant de Dieu,
dans l'amour et dans la bonté. Amen. 💧`,
    quiz: [
      { question: 'Qu\'est-ce que le baptême ?', reponses: ['Un anniversaire religieux', 'Le sacrement qui nous fait enfants de Dieu', 'Une fête de famille', 'Un bain spécial'], bonneReponse: 1, explication: 'Le baptême est le sacrement qui nous fait officiellement enfants de Dieu.' },
      { question: 'Que verse le prêtre pendant le baptême ?', reponses: ['Du lait', 'Du vin', 'De l\'eau', 'De l\'huile d\'olive'], bonneReponse: 2, explication: 'Le prêtre verse de l\'eau sur la tête du baptisé — c\'est le signe de purification et de vie nouvelle.' },
      { question: 'Que symbolise la bougie du baptême ?', reponses: ['La chaleur de la famille', 'Jésus est la lumière du monde', 'Le feu de l\'enfer', 'L\'anniversaire'], bonneReponse: 1, explication: 'La bougie symbolise Jésus, lumière du monde, qui éclaire notre vie.' },
      { question: 'Qui sont les parrains et marraines ?', reponses: ['Des amis qui offrent des cadeaux', 'Des guides spirituels qui aident à grandir dans la foi', 'Les frères et sœurs', 'Les professeurs à l\'école'], bonneReponse: 1, explication: 'Les parrains et marraines ont promis d\'aider l\'enfant à grandir dans la foi chrétienne.' },
      { question: 'Que représente le vêtement blanc du baptême ?', reponses: ['La richesse de la famille', 'La pureté — tu es pur aux yeux de Dieu', 'Le froid de l\'eau', 'La couleur préférée du prêtre'], bonneReponse: 1, explication: 'Le vêtement blanc symbolise la pureté — après le baptême, tu es pur aux yeux de Dieu.' },
    ],
    publie: true,
  },
  {
    ordre: 7,
    titre: 'La Communion',
    sousTitre: 'Jésus dans mon cœur',
    emoji: '🍞',
    contenu: `## La Première Communion — un moment extraordinaire

La **Première Communion** est le jour où tu reçois Jésus pour la première fois dans ton cœur, sous la forme du pain consacré.

C'est un des jours les plus importants de ta vie de chrétien !

### Qu'est-ce que la Communion ?

À la messe, quand le prêtre dit les paroles de consécration, le pain ordinaire devient le **Corps de Jésus**. Ce n'est plus du pain, c'est vraiment Jésus.

Quand tu le reçois dans ta bouche, tu accueilles Jésus en toi. C'est incroyable !

### Comment se préparer ?

Avant de communier, il faut :
- ✅ Être baptisé
- ✅ Avoir fait sa première confession (sacrement de Réconciliation)
- ✅ Avoir appris et compris ce qu'est l'Eucharistie
- ✅ Être en état de grâce (avoir un cœur pur)

### Les fruits de la Communion

En recevant Jésus, tu reçois :
- 💪 La force pour faire le bien
- ❤️ Plus d'amour pour les autres
- ✨ La paix dans ton cœur`,
    activite: `**Activité : Lettre à Jésus avant la communion**

Écris une lettre à Jésus pour lui dire comment tu te sens avant de le recevoir pour la première fois. Qu'est-ce que tu veux lui demander ? Qu'est-ce que tu veux lui offrir ?`,
    priere: `Jésus, je veux te recevoir dans mon cœur.
Prépare mon cœur à t'accueillir avec joie.
Reste avec moi toujours,
et aide-moi à t'aimer de plus en plus. Amen. 🍞`,
    quiz: [
      { question: 'Qu\'est-ce que la Communion ?', reponses: ['Manger du pain ordinaire', 'Recevoir le Corps de Jésus', 'Un geste symbolique seulement', 'Boire du vin de table'], bonneReponse: 1, explication: 'Dans la Communion, on reçoit vraiment Jésus sous la forme du pain consacré.' },
      { question: 'Que devient le pain après la consécration ?', reponses: ['Un souvenir de Jésus', 'Le Corps de Jésus', 'Du pain béni ordinaire', 'Un symbole de paix'], bonneReponse: 1, explication: 'Après la consécration, le pain est vraiment transformé en Corps de Jésus.' },
      { question: 'Que faut-il faire avant la Première Communion ?', reponses: ['Seulement se laver les mains', 'Être baptisé et avoir fait sa première confession', 'Acheter une belle robe blanche', 'Mémoriser toute la Bible'], bonneReponse: 1, explication: 'Il faut être baptisé, avoir fait sa première confession et avoir appris ce qu\'est l\'Eucharistie.' },
      { question: 'Quel fruit reçoit-on en communiant ?', reponses: ['Des bonbons', 'La force, l\'amour et la paix', 'De l\'argent', 'Des bons résultats à l\'école'], bonneReponse: 1, explication: 'La Communion nous donne la force de faire le bien, plus d\'amour pour les autres et la paix.' },
      { question: 'Qu\'est-ce que "être en état de grâce" ?', reponses: ['Porter une belle tenue', 'Avoir un cœur pur, sans péché grave', 'Savoir chanter à la messe', 'Connaître le catéchisme par cœur'], bonneReponse: 1, explication: 'Être en état de grâce signifie avoir un cœur pur, sans péché grave — c\'est pourquoi on se confesse avant.' },
    ],
    publie: true,
  },
  {
    ordre: 8,
    titre: 'Aimer les autres',
    sousTitre: 'Comme Jésus nous l\'a montré',
    emoji: '❤️',
    contenu: `## Le commandement de l'amour

Jésus nous a donné un commandement très important :

> *"Aimez-vous les uns les autres comme je vous ai aimés."* — Jean 13:34

Ce n'est pas toujours facile d'aimer tout le monde. Mais Jésus nous montre comment faire.

### L'amour selon Jésus

**Aimer, c'est :**
- Partager ce qu'on a
- Aider quelqu'un qui est dans le besoin
- Pardonner quand on nous blesse
- Dire des paroles gentilles
- Penser aux autres avant soi

### La parabole du Bon Samaritain

Un homme était blessé sur la route. Un prêtre passa et l'ignora. Un autre homme aussi. Mais un étranger — le Samaritain — s'arrêta, soigna l'homme blessé et paya pour lui.

Jésus demande : **"Qui était le vrai voisin ?"**
La réponse : celui qui a **aidé** !

### L'amour dans ta vie quotidienne

Tu peux aimer comme Jésus :
- 🏠 **À la maison** : aider tes parents, être gentil avec tes frères et sœurs
- 🏫 **À l'école** : défendre un enfant seul, partager tes affaires
- ⛪ **À l'église** : sourire, accueillir les nouveaux`,
    activite: `**Activité : Mes 3 gestes d'amour de la semaine**

Sur une feuille, écris 3 gestes d'amour concrets que tu vas faire cette semaine pour les personnes autour de toi. Après chaque geste accompli, coche-le !`,
    priere: `Seigneur Jésus, apprends-moi à aimer.
Donne-moi un grand cœur pour les autres.
Quand c'est difficile d'aimer, aide-moi.
Je veux vivre ton commandement de l'amour. Amen. ❤️`,
    quiz: [
      { question: 'Quel commandement Jésus nous a-t-il donné ?', reponses: ['Gagne beaucoup d\'argent', 'Sois le meilleur à l\'école', 'Aimez-vous les uns les autres', 'Mange tous tes légumes'], bonneReponse: 2, explication: 'Jésus dit : "Aimez-vous les uns les autres comme je vous ai aimés." C\'est son commandement principal.' },
      { question: 'Dans la parabole, qui a vraiment aidé l\'homme blessé ?', reponses: ['Le prêtre', 'Un autre homme religieux', 'Le Bon Samaritain', 'Un soldat'], bonneReponse: 2, explication: 'C\'est le Bon Samaritain qui s\'est arrêté et a aidé l\'homme blessé — il a été le vrai voisin.' },
      { question: 'Lequel est un geste d\'amour selon Jésus ?', reponses: ['Ignorer quelqu\'un qui souffre', 'Pardonner à celui qui nous blesse', 'Garder tout pour soi', 'Dire du mal des autres'], bonneReponse: 1, explication: 'Pardonner à ceux qui nous blessent est un geste d\'amour très fort — comme Jésus nous a pardonnés.' },
      { question: 'Comment peut-on aimer à l\'école ?', reponses: ['En étant le plus fort', 'En défendant un enfant seul ou en partageant ses affaires', 'En ne parlant à personne', 'En étant premier de la classe'], bonneReponse: 1, explication: 'À l\'école, aimer c\'est défendre les plus faibles, partager, et être gentil avec tout le monde.' },
      { question: 'Qu\'est-ce que Jésus veut dire par "aimer comme il nous a aimés" ?', reponses: ['S\'aimer soi-même d\'abord', 'Aimer ceux qu\'on choisit seulement', 'Aimer même quand c\'est difficile, en donnant sa vie pour les autres', 'Aimer en échange de quelque chose'], bonneReponse: 2, explication: 'Jésus a aimé jusqu\'à donner sa vie pour nous. Il nous demande d\'aimer avec ce même amour généreux.' },
    ],
    publie: true,
  },
]
