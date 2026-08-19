const base = require("./base");

// next/core-web-vitals est applique directement dans apps/web/eslint.config.js
// via la config officielle "eslint-config-next" (compatibilite flat config Next.js 14+).
// Ce fichier ajoute uniquement nos regles de securite/produit par-dessus la base partagee.
module.exports = [
  ...base,
  {
    rules: {
      // Rappel: process.env cote client (composants "use client") ne doit jamais
      // etre lu ailleurs que dans src/lib/env.ts, et uniquement pour des cles
      // prefixees NEXT_PUBLIC_. Voir SECURITY.md. Non force par ESLint ici pour
      // eviter les faux positifs cote Server Components/Route Handlers.
    },
  },
];
