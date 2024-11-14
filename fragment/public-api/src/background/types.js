/**
 * @typedef {Object} StartParams
 * @property {any} ewe The filter engine.
 * @property {any} port A reference to the port object
 * @property {addTrustedMessageTypesFunction} addTrustedMessageTypes Function to add the trusted message types
 * @property {Function} isPremiumActive Function to get the premium state of the user
 * @property {Function} getEncodedLicense Function to get the encoded license of the user
 */

/**
 * A callback function that modifies the allowlist for a tab.
 *
 * @callback addTrustedMessageTypesFunction
 * @param {string} origin - The origin of the message.
 * @param {string[]} types - The message types to be trusted.
 */

// Exporting the types
module.exports = {};
