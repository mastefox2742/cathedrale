"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { LogoutButton } from "@/components/logout-button";

/**
 * Ilot client isole dans le header public (Server Component par ailleurs -
 * voir (public)/layout.tsx "pense pour le SEO... pas de dependance a un
 * token d'auth pour s'afficher"). Seul ce fragment depend de useAuth().
 */
export function NavAuthStatus() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    return (
      <>
        <Link href="/mon-espace">Mon espace</Link>
        <LogoutButton />
      </>
    );
  }

  return (
    <>
      <Link href="/connexion">Connexion</Link>
      <Link href="/inscription">Créer un compte</Link>
    </>
  );
}
