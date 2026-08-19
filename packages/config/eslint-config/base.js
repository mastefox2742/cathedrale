// Config ESLint de base (flat config, ESLint 9) partagee par apps/web et apps/api.
// Regles de securite incluses: eslint-plugin-security detecte les patterns dangereux
// (eval, RegExp non fiable, require dynamique, etc.) directement en local et en CI.
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import");
const securityPlugin = require("eslint-plugin-security");
const prettierConfig = require("eslint-config-prettier");

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  securityPlugin.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: { import: importPlugin },
    rules: {
      // Securite / correction
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "security/detect-object-injection": "off", // trop de faux positifs, mais garde le reste du plugin actif
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": "warn",
      "import/no-extraneous-dependencies": "error",
      "import/no-cycle": "warn",

      // Ne jamais logger de secrets/PII par accident (rappel en revue de code,
      // complete la regle organisationnelle documentee dans SECURITY.md)
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='console'][callee.property.name=/^(log|info|debug)$/] > MemberExpression[property.name=/password|token|secret/i]",
          message:
            "Ne jamais logger un champ contenant password/token/secret, meme en debug.",
        },
      ],
    },
  },
  prettierConfig,
  {
    ignores: ["dist/**", ".next/**", "coverage/**", "node_modules/**", "**/*.js"],
  },
);
