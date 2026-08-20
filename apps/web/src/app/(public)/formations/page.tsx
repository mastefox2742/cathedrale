import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Formations",
};

interface PublicFormation {
  id: string;
  title: string;
  description: string;
  audience: "children" | "teenagers" | "young_adults" | "adults_parents" | "all";
  ageRange: string | null;
  moduleCount: number | null;
  icon: string | null;
  openAccess: boolean;
}

const AUDIENCE_LABELS: Record<PublicFormation["audience"], string> = {
  children: "Enfants",
  teenagers: "Adolescents",
  young_adults: "Jeunes adultes",
  adults_parents: "Adultes et parents",
  all: "Tous publics",
};

/** Server Component - fetch cote serveur vers GET /api/v1/formations/public (voir FormationsController). */
async function getPublicFormations(): Promise<PublicFormation[]> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/formations/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicFormation[];
  } catch {
    // API indisponible : on degrade vers une liste vide plutot que de faire
    // planter la page (voir aussi ISR revalidate: 60 ci-dessus).
    return [];
  }
}

export default async function FormationsPage() {
  const formations = await getPublicFormations();

  return (
    <section>
      <h1>Formations</h1>
      {formations.length === 0 ? (
        <p>Aucune formation publiee pour le moment.</p>
      ) : (
        <ul>
          {formations.map((f) => (
            <li key={f.id} data-audience={f.audience}>
              <h2>
                {f.icon ? `${f.icon} ` : ""}
                {f.title}
              </h2>
              <p>
                {AUDIENCE_LABELS[f.audience]}
                {f.ageRange ? ` - ${f.ageRange}` : ""}
                {f.moduleCount ? ` - ${f.moduleCount} modules` : ""}
              </p>
              <p>{f.description}</p>
              {!f.openAccess ? <p>Compte requis pour suivre ce parcours.</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
