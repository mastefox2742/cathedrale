import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

/**
 * Cahier des charges section 7 "Protection des mineurs et confidentialite" :
 * "Politique de confidentialite accessible" fait partie des mesures minimales
 * avant toute fonctionnalite sociale/catechisme en ligne. Contenu detaille
 * (donnees collectees, duree de conservation, droits RGPD, contact DPO...) a
 * completer par la paroisse - page creee pour que le lien existe deja.
 */
export default function ConfidentialitePage() {
  return (
    <section>
      <h1>Politique de confidentialité</h1>
      <p>
        Les données collectées via cette plateforme (compte, profils enfants, intentions de prière,
        dons...) sont utilisées uniquement dans le cadre de la vie paroissiale, avec un principe de
        collecte minimale.
      </p>
      <p>TODO : détail des données collectées, durée de conservation, droits d&apos;accès et de suppression, contact.</p>
    </section>
  );
}
