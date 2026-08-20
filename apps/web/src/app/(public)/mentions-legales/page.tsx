import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
};

/**
 * Contenu a completer par la paroisse/l'archidiocese (editeur, hebergeur,
 * directeur de publication...) avant mise en production. Page creee pour que
 * le lien du footer ne soit pas mort, pas pour figer un contenu definitif.
 */
export default function MentionsLegalesPage() {
  return (
    <section>
      <h1>Mentions légales</h1>
      <p>
        Cathédrale Sacré-Cœur de Brazzaville — Archidiocèse de Brazzaville, République du Congo.
      </p>
      <p>TODO : éditeur, directeur de publication, hébergeur, coordonnées complètes.</p>
    </section>
  );
}
