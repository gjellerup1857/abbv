/**
 * This file is part of eyeo's Public API fragment,
 * Copyright (C) 2024-present eyeo GmbH

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

export function mainPublicApi() {
  const namespacePrefix = "extension_";

  /**
   * Generates a unique 7 char identifier
   *
   * @returns {string} The identifier
   */
  function generateRequestId() {
    return Math.random().toString(36).substring(2, 9);
  }

  /**
   * Calls an API function from all the registered extensions on the page.
   *
   * @param {string} callName The API to call
   * @param {Object} requestData The request data to call the API with
   * @returns {Promise<*[]>} An array of responses from all the registered extensions
   */
  async function callExtensionAPIs(callName, requestData) {
    const responses = [];
    for (const key in window) {
      if (key.startsWith(namespacePrefix)) {
        const namespaceObject = window[key];

        if (
          namespaceObject &&
          typeof namespaceObject[callName] === "function"
        ) {
          responses.push(namespaceObject[callName](requestData));
        }
      }
    }

    if (responses.length === 0) {
      throw new Error("API is not available yet");
    }

    return Promise.all(responses);
  }

  /**
   * Retrieves the extensions statuses
   *
   * @returns {any[]} An array with the registered extensions statuses
   */
  async function getExtensionsStatus() {
    const requestId = generateRequestId();
    return await callExtensionAPIs("getStatus", { requestId });
  }

  /**
   * Sends a command to the extensions to allowlist the current website
   *
   * @returns {any[]} An array with the registered extensions statuses
   */
  async function allowlistCurrentWebsite({ expiresAt }) {
    const requestId = generateRequestId();
    const requestData = {
      requestId,
      expiresAt,
    };
    return await callExtensionAPIs("allowlistWebsite", requestData);
  }

  function init() {
    // Define the publicAPI on the window object
    if (!window.hasOwnProperty("publicAPI")) {
      Object.defineProperty(window, "publicAPI", {
        value: {
          getExtensionsStatus,
          allowlistCurrentWebsite,
        },
        writable: false, // Prevent modification of the value
        configurable: false, // Prevent the property from being deleted or redefined
        enumerable: true, // Allow the property to be enumerated (optional)
      });
    }
  }

  init();
  console.log("Public API was initialized on the page.");
}
