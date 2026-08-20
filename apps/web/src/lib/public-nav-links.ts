/**
 * Liens de navigation publique, partages entre le header et le footer
 * ((public)/layout.tsx et components/site-footer.tsx) pour eviter toute
 * derive entre les deux. Limites aux pages qui existent reellement
 * (Jeunesse, Catechisme, Mediatheque, Dons, Contact restent a construire -
 * cahier des charges section 3 "Menu public").
 */
export const PUBLIC_NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/horaires", label: "Horaires et liturgie" },
  { href: "/annonces", label: "Annonces" },
  { href: "/homelies", label: "Homélies" },
  { href: "/evenements", label: "Événements" },
  { href: "/formations", label: "Formations" },
] as const;
