const cscConfig = require("@csc/config/eslint-config/nextjs");

// "next/core-web-vitals" (eslint-config-next@14.x) est desactive : plusieurs
// de ses regles (@next/eslint-plugin-next, ex. no-duplicate-head) appellent
// encore l'API legacy `context.getAncestors()`/`context.getScope()` retiree
// dans ESLint 9, ce qui fait planter le linter (pas un simple avertissement).
// eslint-config-next n'a une vraie compatibilite flat-config/ESLint 9 qu'a
// partir de Next.js 15. A reactiver via `compat.extends("next/core-web-vitals")`
// (package @eslint/eslintrc) apres la montee de version vers Next 15.
module.exports = [...cscConfig];
