"use client";

import Link from "next/link";
import { hasPermission } from "@csc/shared";
import { RouteGuard } from "@/components/route-guard";
import { LogoutButton } from "@/components/logout-button";
import { useAuth } from "@/lib/auth-context";

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
        <header>
          <AdminNav />
          <LogoutButton />
        </header>
        <main>{children}</main>
      </div>
    </RouteGuard>
  );
}

/**
 * Liens limites aux pages qui existent reellement (Tableau de bord, Journaux
 * d'audit). Le reste du "Menu administration" du cahier des charges
 * (Annonces, Liturgie, Homelies, Formations, Evenements, Catechisme,
 * Jeunesse, Groupes, Mediatheque, Notifications, Abonnements, Dons,
 * Utilisateurs et roles, Protection et signalements, Parametres) n'a pas
 * encore d'interface admin - seuls les endpoints API existent pour l'instant
 * (crees/publies via l'API directement, pas de formulaire web).
 */
function AdminNav() {
  const { user } = useAuth();
  const canViewAuditLog = !!user && hasPermission(user.roles, "audit_log", "view");

  return (
    <nav aria-label="Navigation administration">
      <ul>
        <li>
          <Link href="/admin">Tableau de bord</Link>
        </li>
        {canViewAuditLog ? (
          <li>
            <Link href="/admin/audit-log">Journaux d&apos;audit</Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
