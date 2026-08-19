/**
 * Layout des pages publiques (accessibles sans compte - cahier des charges 2.1).
 * Pense pour le SEO : contenu rendu cote serveur, pas de dependance a un token
 * d'auth pour s'afficher.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>{/* TODO: nav publique (Horaires, Annonces, Homelies, Evenements, Formations...) */}</header>
      <main>{children}</main>
      <footer>{/* TODO: contact, adresse, liens legaux */}</footer>
    </div>
  );
}
