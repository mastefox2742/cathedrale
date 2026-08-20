import Link from "next/link";
import { PUBLIC_NAV_LINKS } from "@/lib/public-nav-links";

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
];

/**
 * Cahier des charges 2.1 : "l'adresse, les contacts et les horaires
 * d'accueil" doivent etre publics. Coordonnees placeholder - a completer
 * par la paroisse avant mise en production (memes valeurs que l'ancienne
 * app Vite/Firebase, voir legacy/src/components/layout/Footer.tsx).
 */
const CONTACT = {
  address: "Avenue de la Paix, Brazzaville, République du Congo",
  phone: "+242 06 000 00 00",
  email: "contact@sacrecoeur-brazza.cg",
};

export function SiteFooter() {
  return (
    <footer>
      <div>
        <p>Cathédrale Sacré-Cœur de Brazzaville</p>
        <p>Maison de Dieu ouverte à tous. Prière, liturgie, formation et fraternité au cœur de Brazzaville.</p>
      </div>

      <nav aria-label="Navigation du pied de page">
        <h2>Navigation</h2>
        <ul>
          {PUBLIC_NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <address>
        <h2>Contact</h2>
        <p>{CONTACT.address}</p>
        <p>
          <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>{CONTACT.phone}</a>
        </p>
        <p>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </p>
      </address>

      <ul>
        {LEGAL_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>

      <p>© {new Date().getFullYear()} Cathédrale Sacré-Cœur de Brazzaville — Tous droits réservés</p>
    </footer>
  );
}
