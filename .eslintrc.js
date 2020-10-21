module.exports = {
  extends: "divid",
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    "@typescript-eslint/no-redeclare": "off",
    "@typescript-eslint/naming-convention": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/consistent-type-imports": "off",
    "@typescript-eslint/prefer-optional-chain": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/prefer-readonly-parameter-types": "off",
    "@typescript-eslint/no-shadow": "off",
    "@typescript-eslint/dot-notation": "off",
    "@typescript-eslint/init-declarations": "off",
  },
};
