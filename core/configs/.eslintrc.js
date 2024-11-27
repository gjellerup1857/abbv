"use strict";

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    webextensions: true
  },
  ignorePatterns: ["dist/"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "love",
        "plugin:prettier/recommended"
      ],
      parser: "@typescript-eslint/parser",
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
      rules: {
        // Add other JavaScript-specific rules here
      },
    },
  ],
};
