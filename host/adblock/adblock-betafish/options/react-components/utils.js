/* For ESLint: List any global identifiers used in this file below */
/* global browser */

const VERBOSE_DEBUG = false;

export const translate = function (messageName, substitutions) {
  if (!messageName || typeof messageName !== "string") {
    // eslint-disable-next-line no-console
    console.trace("missing messageName");
    return "";
  }

  let parts = substitutions;
  if (Array.isArray(parts)) {
    for (let i = 0; i < parts.length; i++) {
      if (typeof parts[i] !== "string") {
        parts[i] = parts[i].toString();
      }
    }
  } else if (parts && typeof parts !== "string") {
    parts = parts.toString();
  }

  // if VERBOSE_DEBUG is set to true, duplicate (double the length) of the translated strings
  // used for testing purposes only
  if (VERBOSE_DEBUG) {
    return `${browser.i18n.getMessage(messageName, parts)}
            ${browser.i18n.getMessage(messageName, parts)}`;
  }
  return browser.i18n.getMessage(messageName, parts);
};
