"use client";

import { RouteGuard } from "@/components/route-guard";

/**
 * Espace administration (cahier des charges "Menu administration").
 * requireStaff garantit qu'un simple membre ne peut pas naviguer jusqu'ici,
 * meme si un lien direct est devine - la verification serveur (PermissionsGuard)
 * reste neanmoins la protection reelle sur chaque action.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireStaff>
      <div>
        <header>{/* TODO: nav admin (Annonces, Liturgie, Formations, Utilisateurs, Audit...) */}</header>
        <main>{children}</main>
      </div>
    </RouteGuard>
  );
}
