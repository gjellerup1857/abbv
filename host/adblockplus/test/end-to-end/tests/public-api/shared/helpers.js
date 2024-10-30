"use strict";

const crypto = require("crypto");
const {
  arrayBufferToBase64,
  updatePrefs
} = require("../../../helpers");
const {blockHideUrl} = require("../../../test-data/data-smoke-tests");

const algorithm = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 4096,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: {name: "SHA-512"}
};
let keyPair;
let publicKey;

/**
 * Generates the encryption keys
 */
async function generateEncryptionKeys()
{
  // Generate the key pair
  keyPair = await crypto.subtle.generateKey(
    algorithm,
    true, // Whether the key is exportable
    ["sign", "verify"] // Usage for private and public keys
  );

  // Export the public key
  publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
}

/**
 * Encrypts the message using the private key.
 *
 * @param {string} message - The message to encrypt.
 * @returns {Promise<string>}
 */
async function encryptMessage(message)
{
  const abData = new TextEncoder().encode(message);
  const abSignature = await crypto.subtle.sign(
    algorithm,
    keyPair.privateKey,
    abData
  );
  return arrayBufferToBase64(abSignature);
}

/**
 * Replaces the default public key in the extension used for
 * signing the messages
 * @param {string} prefsKeyName The pref key name.
 */
async function updateExtPrefAPIKey(prefsKeyName)
{
  if (!keyPair)
  {
    await generateEncryptionKeys();
  }

  // update the allowlisting authorized keys
  const publicKeyBase64 = arrayBufferToBase64(publicKey);

  return updatePrefs(prefsKeyName, [publicKeyBase64]);
}

/**
 * Sends a public API command to the content-script.
 *
 * @param {string} [triggerEventName] - The event name to trigger
 * @param {string} [responseEventName] - The event name to listen on
 * @param {object} [extraParams] - Extra parameters to be sent on the event.
 * @returns {Promise<!IThenable<T>|*>}
 */
async function sendExtCommand({triggerEventName, responseEventName, options})
{
  const parsedUrl = new URL(blockHideUrl);
  const domain = parsedUrl.hostname;
  const timestamp = Date.now();
  const data = `${domain},${timestamp}`;
  const signature = await encryptMessage(data);

  return browser.executeAsync(
    (params, callback) =>
    {
      const event = new CustomEvent(params.triggerEventName, {
        detail: {
          domain: params.domain,
          signature: params.signature,
          timestamp: params.timestamp,
          options: params.options
        }
      });

      // listen for "domain_allowlisting_success" event
      document.addEventListener(params.responseEventName, (ev) =>
        callback(ev.detail ? ev.detail : true)
      );

      // dispatch the event, will be intercepted by the content-script
      document.dispatchEvent(event);

      // if the event is not received in 5 seconds, consider it failed
      setTimeout(() => callback(null), 5000);
    },
    {domain, signature, timestamp, options, triggerEventName, responseEventName}
  );
}


module.exports = {
  updateExtPrefAPIKey,
  sendExtCommand
};
