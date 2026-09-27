/** Identité du site et médias de la page d'accueil. */
export const SITE = {
  nom: 'Archidiocèse de Brazzaville',
  nomCourt: 'Archidiocèse',
  devise: 'Informer, former, accompagner et rassembler toutes les paroisses et tous les chercheurs de Dieu.',
  /**
   * Vidéo de présentation de l'archidiocèse (bandeau d'accueil) : MP4 H.264,
   * muette, 20 à 60 s, idéalement moins de 15 Mo. Soit le fichier
   * public/videos/archidiocese.mp4, soit une URL (Supabase Storage, CDN…)
   * dans la variable NEXT_PUBLIC_HERO_VIDEO_URL.
   */
  videoAccueil: process.env.NEXT_PUBLIC_HERO_VIDEO_URL || '/videos/archidiocese.mp4',
  /** Image affichée le temps que la vidéo charge (et si elle est absente). */
  imageAccueil: '/cathedrale.jpg',
}
