/* eslint-env node */

"use strict";

const config = require("../../core/configs/.prettierrc.js");

module.exports = {
  ...config,
  trailingComma: "none"
};
