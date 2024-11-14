"use strict";

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    webextensions: true
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "love",
        "plugin:prettier/recommended"
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      rules: {
        "@typescript-eslint/strict-boolean-expressions": "off",
        "curly": "error"
      }
    },
    {
      // JavaScript-specific rules
      files: ["*.js"],
      extends: [
        "plugin:prettier/recommended"
      ],
      "parserOptions": {
        "sourceType": "module"
      },
      rules: {
        // Add other JavaScript-specific rules here
      },
    },
  ],
};
