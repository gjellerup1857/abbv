/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2013-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

/* For ESLint: List any global identifiers used in this file below */
/* global browser, log */

import { License } from "./check";

/**
 * Algorithm used to verify authenticity of sender
 */
const algorithm = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 4096,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: { name: "SHA-512" },
};
/**
 * Time (in milliseconds) from now for which we consider signatures to be valid
 * based on their associated timestamps
 */
const signatureExpiration = 60 * 60 * 1000;

/**
 * Converts base64 string into array buffer
 *
 * @param {string} str - base64 string
 *
 * @returns {Uint8Array} array buffer
 */
function base64ToArrayBuffer(str) {
  const decodedData = atob(str);
  return Uint8Array.from(decodedData, (c) => c.charCodeAt(0));
}

/**
 * Encodes request data to sign for verifying authenticity of sender
 *
 * @param {string} domain - Sender domain
 * @param {number} timestamp - Timestamp of current date and time
 *
 * @returns {Uint8Array} Encoded request data
 */
function getAllowData(domain, timestamp) {
  const str = `${domain},${timestamp}`;
  return new TextEncoder().encode(str);
}

/**
 * Generates public key from string for verifying signatures
 *
 * @param {string} key - public key string
 *
 * @returns {Promise<CryptoKey>} public key
 */
async function getKey(key) {
  const abKey = base64ToArrayBuffer(key);
  const importedKey = await crypto.subtle.importKey("spki", abKey, algorithm, false, ["verify"]);
  return importedKey;
}

/**
 * Handles incoming "users.isPaying" messages
 *
 * @param {Object} message - "users.isPaying" message
 * @param {Object} sender - Message sender
 *
 * @returns {Promise<string|null>} requested payload
 */
async function handleUsersIsPayingMessage(message, sender) {
  // Check Premium state
  if (!License.isActiveLicense()) {
    log("user not active");
    return null;
  }

  // Verify timestamp
  const { signature, timestamp } = message;
  /* eslint-disable-next-line no-use-before-define */
  const validTimestamp = verifyTimestamp(timestamp);
  if (!validTimestamp) {
    log("invalid Timestamp", timestamp);
    return null;
  }

  // Verify signature
  const domain = new URL(sender.url).hostname;
  /* eslint-disable-next-line no-use-before-define */
  const validSignature = await verifySignature(domain, timestamp, signature);
  if (!validSignature) {
    log("invalid signature");
    return null;
  }

  // Retrieve payload
  const payload = License.getBypassPayload();
  if (!payload) {
    log("no bypass mode payload");
    return null;
  }

  return payload;
}

/**
 * Checks whether signature matches data and any of the known public keys
 * that are authorized to use the bypass API
 *
 * @param {string} domain - Sender domain
 * @param {number} timestamp - Timestamp of current date and time
 * @param {string} signature - Signature for provided domain and timestamp
 *
 * @returns {Promise<boolean>} whether signature matches data and any authorized public key
 */
async function verifySignature(domain, timestamp, signature) {
  if (typeof signature !== "string") {
    return false;
  }

  const data = getAllowData(domain, timestamp);
  const abSignature = base64ToArrayBuffer(signature);

  const promisedValidations = License.MAB_CONFIG.bypassAuthorizedKeys.map(
    /* eslint-disable-next-line no-use-before-define */
    (key) => verifySignatureWithKey(data, abSignature, key),
  );
  const validations = await Promise.all(promisedValidations);
  return validations.some((isValid) => isValid);
}

/**
 * Checks whether signature matches data and public key
 *
 * @param {Uint8Array} data - Encoded data
 * @param {Uint8Array} signature - Signature for encoded data
 * @param {string} pubKey - Public key
 *
 * @returns {Promise<boolean>} whether signature matches data and public key
 */
async function verifySignatureWithKey(data, signature, pubKey) {
  return crypto.subtle.verify(algorithm, await getKey(pubKey), signature, data);
}

/**
 * Checks whether timestamp is valid
 *
 * @param {number} timestamp - Timestamp
 *
 * @returns {boolean} whether timestamp is valid
 */
function verifyTimestamp(timestamp) {
  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    log("timestamp is not number", timestamp);
    return false;
  }

  const timeDiff = Date.now() - timestamp;
  return timeDiff < signatureExpiration;
}

/**
 * Initializes module
 */
function start() {
  /* eslint-disable consistent-return */
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.command !== "users.isPaying") {
      return;
    }

    return handleUsersIsPayingMessage(message, sender);
  });
  /* eslint-enable consistent-return */
}

start();
