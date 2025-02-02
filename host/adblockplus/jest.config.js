/* eslint-env node */

"use strict";

/**
 * For a detailed explanation regarding each configuration property and type
 * check, visit:
 * https://jestjs.io/docs/configuration
 */
module.exports = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["json", "html", "text"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1"
  },
  resetMocks: true,
  restoreMocks: true,
  setupFiles: ["jest-webextension-mock", "./mocks/js/jest-polyfill.js"],
  testEnvironment: "./mocks/js/jest-jsdom.mjs",
  testMatch: ["**/*.spec.ts"]
};
