import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Événements",
};

interface PublicEvent {
  id: string;
  title: string;
  type: "liturgy" | "formation" | "youth" | "catechism" | "family" | "social" | "meeting" | "live" | "solidarity_campaign";
  description: string;
  date: string;
  endDate: string | null;
  location: string | null;
  responsible: string | null;
  liveUrl: string | null;
  replayUrl: string | null;
  registrationEnabled: boolean;
}

const TYPE_LABELS: Record<PublicEvent["type"], string> = {
  liturgy: "Liturgie",
  formation: "Formation",
  youth: "Jeunesse",
  catechism: "Catéchisme",
  family: "Famille",
  social: "Social",
  meeting: "Réunion",
  live: "Direct vidéo",
  solidarity_campaign: "Campagne de solidarité",
};

/** Server Component - fetch cote serveur vers GET /api/v1/events/public (voir EventsController). */
async function getPublicEvents(): Promise<PublicEvent[]> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/events/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicEvent[];
  } catch {
    // API indisponible : on degrade vers une liste vide plutot que de faire
    // planter la page (voir aussi ISR revalidate: 60 ci-dessus).
    return [];
  }
}

export default async function EvenementsPage() {
  const events = await getPublicEvents();

  return (
    <section>
      <h1>Événements</h1>
      {events.length === 0 ? (
        <p>Aucun événement publié pour le moment.</p>
      ) : (
        <ul>
          {events.map((e) => (
            <li key={e.id} data-type={e.type}>
              <h2>{e.title}</h2>
              <p>
                {TYPE_LABELS[e.type]} - {new Date(e.date).toLocaleDateString("fr-FR")}
                {e.location ? ` - ${e.location}` : ""}
                {e.responsible ? ` - ${e.responsible}` : ""}
              </p>
              <p>{e.description}</p>
              {e.liveUrl ? (
                <p>
                  <a href={e.liveUrl}>Suivre en direct</a>
                </p>
              ) : null}
              {e.replayUrl ? (
                <p>
                  <a href={e.replayUrl}>Voir le replay</a>
                </p>
              ) : null}
              {e.registrationEnabled ? <p>Inscription requise.</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
