import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Annonces",
};

interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "important" | "urgent";
  publishAt: string | null;
}

/**
 * Exemple de Server Component effectuant un fetch cote serveur vers une route
 * publique de l'API (pas de token requis - voir AnnouncementsController.listPublic).
 * `next: { revalidate }` active l'ISR : la page est regeneree au plus toutes
 * les 60s plutot que d'etre statique indefiniment ou de refetcher a chaque requete.
 */
async function getPublicAnnouncements(): Promise<PublicAnnouncement[]> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/announcements/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicAnnouncement[];
  } catch {
    // API indisponible (reseau, demarrage, build sans backend live) : on degrade
    // vers une liste vide plutot que de faire planter la page (voir aussi ISR
    // revalidate: 60 ci-dessus, qui retentera au prochain appel).
    return [];
  }
}

export default async function AnnoncesPage() {
  const announcements = await getPublicAnnouncements();

  return (
    <section>
      <h1>Annonces paroissiales</h1>
      {announcements.length === 0 ? (
        <p>Aucune annonce publiee pour le moment.</p>
      ) : (
        <ul>
          {announcements.map((a) => (
            <li key={a.id} data-priority={a.priority}>
              <h2>{a.title}</h2>
              <p>{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
