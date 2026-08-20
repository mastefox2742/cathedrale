import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Homélies",
};

interface PublicHomily {
  id: string;
  title: string;
  contentType: "text" | "audio" | "video";
  text: string | null;
  mediaUrl: string | null;
  celebrant: string;
  celebration: string | null;
  date: string;
  summary: string | null;
  keywords: string[];
  downloadable: boolean;
}

const CONTENT_TYPE_LABELS: Record<PublicHomily["contentType"], string> = {
  text: "Texte",
  audio: "Audio",
  video: "Vidéo",
};

/** Server Component - fetch cote serveur vers GET /api/v1/homilies/public (voir HomiliesController). */
async function getPublicHomilies(): Promise<PublicHomily[]> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/homilies/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicHomily[];
  } catch {
    // API indisponible : on degrade vers une liste vide plutot que de faire
    // planter la page (voir aussi ISR revalidate: 60 ci-dessus).
    return [];
  }
}

export default async function HomeliesPage() {
  const homilies = await getPublicHomilies();

  return (
    <section>
      <h1>Homélies</h1>
      {homilies.length === 0 ? (
        <p>Aucune homélie publiée pour le moment.</p>
      ) : (
        <ul>
          {homilies.map((h) => (
            <li key={h.id} data-type={h.contentType}>
              <h2>{h.title}</h2>
              <p>
                {CONTENT_TYPE_LABELS[h.contentType]} - {h.celebrant}
                {h.celebration ? ` - ${h.celebration}` : ""} - {new Date(h.date).toLocaleDateString("fr-FR")}
              </p>
              {h.summary ? <p>{h.summary}</p> : null}
              {h.contentType === "text" && h.text ? <p>{h.text}</p> : null}
              {h.contentType !== "text" && h.mediaUrl ? (
                <p>
                  <a href={h.mediaUrl}>{h.downloadable ? "Écouter / télécharger" : "Écouter"}</a>
                </p>
              ) : null}
              {h.keywords.length > 0 ? <p>{h.keywords.join(", ")}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
