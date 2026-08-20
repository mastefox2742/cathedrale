import Link from "next/link";
import { NavAuthStatus } from "@/components/nav-auth-status";
import { SiteFooter } from "@/components/site-footer";
import { PUBLIC_NAV_LINKS } from "@/lib/public-nav-links";

/**
 * Layout des pages publiques (accessibles sans compte - cahier des charges 2.1).
 * Pense pour le SEO : contenu rendu cote serveur, pas de dependance a un token
 * d'auth pour s'afficher - seul <NavAuthStatus> (ilot client isole) sait si un
 * visiteur est connecte.
 *
 * Liens volontairement limites aux pages qui existent reellement (Jeunesse,
 * Catechisme, Mediatheque, Dons, Contact restent a construire - cahier des
 * charges section 3 "Menu public").
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <nav aria-label="Navigation principale">
          <Link href="/">Cathédrale Sacré-Cœur de Brazzaville</Link>
          <ul>
            {PUBLIC_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <NavAuthStatus />
        </div>
      </header>
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
