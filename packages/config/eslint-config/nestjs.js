const base = require("./base");

module.exports = [
  ...base,
  {
    rules: {
      // NestJS s'appuie fortement sur les decorateurs et l'injection de dependances
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
