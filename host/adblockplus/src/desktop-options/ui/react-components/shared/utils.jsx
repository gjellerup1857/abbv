import browser from "webextension-polyfill";

/**
 * Return the localized string for the given key.
 *
 * @param {string} i18nKey - The key to look up in the i18n messages.
 * @returns {string}
 */
export const translate = (i18nKey) => browser.i18n.getMessage(i18nKey);
