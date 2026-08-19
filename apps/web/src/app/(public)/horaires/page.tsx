import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Horaires et liturgie",
};

interface PublicMassSchedule {
  id: string;
  title: string;
  celebrationType: "mass" | "confession" | "adoration" | "office" | "other";
  date: string | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  recurrence: string | null;
  note: string | null;
}

const CELEBRATION_LABELS: Record<PublicMassSchedule["celebrationType"], string> = {
  mass: "Messe",
  confession: "Confession",
  adoration: "Adoration",
  office: "Office",
  other: "Autre",
};

/** Server Component - fetch cote serveur vers GET /api/v1/mass-schedules/public (voir MassSchedulesController). */
async function getPublicMassSchedules(): Promise<PublicMassSchedule[]> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/mass-schedules/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicMassSchedule[];
  } catch {
    // API indisponible : on degrade vers une liste vide plutot que de faire
    // planter la page (voir aussi ISR revalidate: 60 ci-dessus).
    return [];
  }
}

export default async function HorairesPage() {
  const schedules = await getPublicMassSchedules();

  return (
    <section>
      <h1>Horaires et liturgie</h1>
      {schedules.length === 0 ? (
        <p>Aucun horaire publie pour le moment.</p>
      ) : (
        <ul>
          {schedules.map((s) => (
            <li key={s.id} data-type={s.celebrationType}>
              <h2>{s.title}</h2>
              <p>
                {CELEBRATION_LABELS[s.celebrationType]} - {s.startTime}
                {s.endTime ? `–${s.endTime}` : ""}
                {s.location ? ` - ${s.location}` : ""}
              </p>
              {s.recurrence ? <p>{s.recurrence}</p> : null}
              {s.note ? <p>{s.note}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
