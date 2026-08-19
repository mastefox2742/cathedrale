import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horaires et liturgie",
};

/**
 * Page publique (cahier des charges 2.1 et 5.1). A brancher sur un futur
 * endpoint public GET /api/v1/mass-schedules/public une fois le module
 * "Liturgie" implemente cote API (suivre le pattern du module Annonces).
 */
export default function HorairesPage() {
  return (
    <section>
      <h1>Horaires et liturgie</h1>
      <p>TODO: horaires des messes, offices et confessions.</p>
    </section>
  );
}
