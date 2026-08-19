"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isStaff, type Role } from "@csc/shared";
import { useAuth } from "@/lib/auth-context";

interface RouteGuardProps {
  children: React.ReactNode;
  /** Si fourni, exige qu'au moins un de ces roles soit present (en plus d'etre connecte). */
  requireAnyRole?: Role[];
  /** Raccourci pour les roles "responsable" (cf packages/shared STAFF_ROLES). */
  requireStaff?: boolean;
}

/**
 * Garde-fou COTE CLIENT uniquement : ameliore l'UX (redirection immediate,
 * pas de flash de contenu prive) mais NE remplace JAMAIS la verification
 * serveur. Chaque appel API sensible est de toute facon revalide par
 * JwtAuthGuard + PermissionsGuard cote NestJS - voir SECURITY.md.
 */
export function RouteGuard({ children, requireAnyRole, requireStaff }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/connexion");
      return;
    }
    if (requireStaff && !isStaff(user.roles)) {
      router.replace("/");
      return;
    }
    if (requireAnyRole && !requireAnyRole.some((role) => user.roles.includes(role))) {
      router.replace("/");
    }
  }, [user, isLoading, requireAnyRole, requireStaff, router]);

  if (isLoading || !user) return null; // ou un composant de chargement

  return <>{children}</>;
}
