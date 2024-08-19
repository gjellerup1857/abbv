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
/* global browser, ext */

import * as ewe from "@eyeo/webext-ad-filtering-solution";
import { log } from "../utilities/background/index";
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
  return crypto.subtle.importKey("spki", abKey, algorithm, false, ["verify"]);
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
  if (!isValidPremiumAuthMessage(message)) {
    return null;
  }

  // Check Premium state
  if (!License.isActiveLicense()) {
    log("user not active");
    return null;
  }

  const isVerified = await verifyRequest(message, sender);
  if (!isVerified) {
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

  const promisedValidations = License.MAB_CONFIG.bypassAuthorizedKeys.map((key) =>
    verifySignatureWithKey(data, abSignature, key),
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
 * Checks whether request is valid
 *
 * @param {Object} message - Request message
 * @param {Object} sender - Message sender
 *
 * @returns {Promise<boolean>} whether request is valid
 */
async function verifyRequest(message, sender) {
  const { signature, timestamp } = message;
  const domain = new URL(sender.url).hostname;

  if (!verifyTimestamp(timestamp)) {
    return false;
  }

  const isSignatureValid = await verifySignature(domain, timestamp, signature);

  return !!isSignatureValid;
}

/**
 * Checks whether candidate is a valid message for premium authentication.
 *
 * @param candidate - Candidate
 * @returns whether candidate is a valid message for premium authentication
 */
function isValidPremiumAuthMessage(candidate) {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "signature" in candidate &&
    "timestamp" in candidate
  );
}

/**
 * Handles incoming "filters.isTabAllowlisted" messages
 *
 * @param message - "filters.isTabAllowlisted" message
 * @param sender - Message sender
 *
 * @returns {Promise<Array>} whether current tab is allowlisted and all allowlisting filters
 */
const handleIsTabAllowlistedMessage = async (message, sender) => {
  if (sender?.tab?.id !== undefined) {
    const allowlistingFilters = await ewe.filters.getAllowingFilters(sender.tab.id);
    let source = null;
    if (allowlistingFilters.length > 0) {
      const metaData = await ewe.filters.getMetadata(allowlistingFilters[0]);
      source = metaData !== null && metaData.origin === "web" ? "1ca" : "user";
    }

    return [allowlistingFilters.length > 0, source, ewe?.allowlisting !== undefined];
  }

  return [];
};

/**
 * Handles incoming "premium.signature" messages
 *
 * @param {Object} message - "premium.signature" message
 * @param {Object} sender - Message sender
 *
 * @returns {Promise<Object|null>} response from server
 */
const handleSignatureRequest = async (message, sender) => {
  if (!isValidPremiumAuthMessage(message) || !("w" in message)) {
    return null;
  }
  const isRequestVerified = await verifyRequest(message, sender);
  if (!isRequestVerified) {
    return null;
  }

  const { w } = message;
  try {
    const response = await fetch(`${License.MAB_CONFIG.signatureURL}/mw/sign_pbm?w=${w}`, {
      method: "POST",
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    return null;
  }
};

/**
 * Initializes module
 */
function start() {
  ext.addTrustedMessageTypes(null, ["app.get"]);
  ext.addTrustedMessageTypes(null, ["subscriptions.get"]);
  ext.addTrustedMessageTypes(null, ["filters.isTabAllowlisted"]);
  ext.addTrustedMessageTypes(null, ["premium.signature"]);
  ext.addTrustedMessageTypes(null, ["prefs.get"]);

  browser.runtime.onMessage.addListener((message, sender) => {
    switch (message.command) {
      case "users.isPaying":
        return handleUsersIsPayingMessage(message, sender);
      case "filters.isTabAllowlisted":
        return handleIsTabAllowlistedMessage(message, sender);
      case "premium.signature":
        return handleSignatureRequest(message, sender);
      default:
        return null;
    }
  });
}

start();
