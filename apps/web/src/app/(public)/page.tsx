import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accueil",
};

/**
 * Page d'accueil (cahier des charges section 4). A completer avec les blocs
 * recommandes : horaires de la prochaine messe, annonce prioritaire, prochain
 * evenement, acces rapide priere du jour / formation jeunesse / dons / groupes.
 * Server Component par defaut -> ideal pour le SEO et le rendu initial rapide.
 */
export default function HomePage() {
  return (
    <section>
      <h1>Cathédrale Sacré-Cœur de Brazzaville</h1>
      <p>Maison numerique de la foi : informer, former, accompagner et rassembler.</p>
      {/* TODO: brancher sur GET /api/v1/mass-schedules/next et /announcements/public */}
    </section>
  );
}
