"use client";

import { RouteGuard } from "@/components/route-guard";

/** Espace membre connecte (cahier des charges "Menu connecte"). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div>
        <header>{/* TODO: nav "Mon espace / Ma progression / Mes groupes / ..." */}</header>
        <main>{children}</main>
      </div>
    </RouteGuard>
  );
}
