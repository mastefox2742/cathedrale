"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

/**
 * Bouton de deconnexion reutilisable (espace membre + espace admin).
 * Pas de redirection manuelle ici : une fois `user` passe a null, RouteGuard
 * (qui protege deja toute page ou ce bouton apparait) redirige lui-meme vers
 * /connexion via son propre useEffect. Ajouter un router.replace() ici cree
 * une course entre deux redirections concurrentes vers des cibles differentes.
 */
export function LogoutButton() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleClick() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <button type="button" onClick={() => void handleClick()} disabled={loggingOut}>
      {loggingOut ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
