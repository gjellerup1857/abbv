/* eslint-env node */

/**
 * NOTE: This file just points to the actual configuration file found in the
 * `eslint` directory. Do not make changes to this file directly, but instead
 * to the configuration file this file points to.
 */

module.exports = {
  extends: "./eslint/legacy.js",
  overrides: [
    {
      files: ["*.jsx"],
      rules: {
        strict: "off", // Disable 'strict' rule for JSX files
      },
    },
  ],
};
