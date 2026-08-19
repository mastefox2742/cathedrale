"use client";

import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <section>
      <h1>Bonjour {user?.displayName}</h1>
      <p>TODO: progression, prochaine lecon, mes groupes, mes inscriptions, favoris.</p>
    </section>
  );
}
