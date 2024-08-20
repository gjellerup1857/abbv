/* eslint-env node */

"use strict";

const config = {
  rootDir: "../../../",
  preset: "./jest.config.js",
  setupFilesAfterEnv: ["jest-extended/all"]
};

module.exports = config;
