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

/**
 * Api that will be injected into the main world for exposing the
 * methods for the public API.
 *
 * @param {object} details Details for initializing the API.
 * @param {string} details.allowlistingTriggerEvent The event type for triggering an allowlisting call
 * @param {string} details.allowlistingResponseEvent The event type for listening for an allowlisting response
 * @param {object} details.extensionData The extension data to be passed on the page.
 */
export function webpageAPI({
  allowlistingTriggerEvent,
  allowlistingResponseEvent,
  extensionData,
}) {
  const { extensionInfo } = extensionData;
  const API_VERSION = "1.0.0";
  const namespacePrefix = "extension_";
  const extName = extensionInfo.name;
  const namespaceName = `${namespacePrefix}${extName}`;
  const extAllowlistingTriggerEvent = `${extName}.${allowlistingTriggerEvent}`;
  const extAllowlistingResponseEvent = `${extName}.${allowlistingResponseEvent}`;

  /**
   * Sends a command to the extension to allowlist the current website
   *
   * @param {object} allowlistingOptions The options for allowlisting the current website
   * @param {number} timeoutMs How long to wait for a reply before resolving with a timeout error
   * @returns {Promise<unknown>} The response from the extension
   */
  async function allowlistWebsite(allowlistingOptions, timeoutMs = 3000) {
    console.log(
      "sent trigger event to content script",
      extAllowlistingTriggerEvent,
    );
    return new Promise((resolve, reject) => {
      function eventHandler(event) {
        console.log(
          "received response from the extension in main world",
          event,
          event.detail,
        );

        document.removeEventListener(
          extAllowlistingResponseEvent,
          eventHandler,
        );
        resolve(event.detail);
      }

      document.addEventListener(extAllowlistingResponseEvent, eventHandler);

      // Trigger the allowlisting in the content script
      document.dispatchEvent(
        new CustomEvent(extAllowlistingTriggerEvent, {
          detail: {
            options: allowlistingOptions,
            timeout: timeoutMs,
          },
        }),
      );
    });
  }

  const namespace = Object.freeze({
    API_VERSION,
    getStatus: () => extensionData,
    allowlistWebsite,
  });

  /**
   * Calls an API function from all the registered extensions on the page.
   *
   * @param {string} callName The API to call
   * @param {any} args Arguments for the call function
   * @returns {Promise<*[]>} An array of responses from all the registered extensions.
   */
  async function callExtensionAPIs(callName, ...args) {
    const responses = [];

    for (const key in window) {
      if (key.startsWith(namespacePrefix)) {
        const namespaceObject = window[key];

        if (
          namespaceObject &&
          typeof namespaceObject[callName] === "function"
        ) {
          responses.push(namespaceObject[callName](...args));
        }
      }
    }

    return Promise.all(responses);
  }

  /**
   * Retrieves the extensions statuses
   *
   * @returns {any[]} An array with the registered extensions statuses
   */
  async function getExtensionsStatus() {
    return await callExtensionAPIs("getStatus");
  }

  /**
   * Sends a command to the extensions to allowlist the current website
   *
   * @returns {any[]} An array with the registered extensions statuses
   */
  async function allowlistCurrentWebsite({ expiresAt }, timeoutMs) {
    return await callExtensionAPIs(
      "allowlistWebsite",
      { expiresAt },
      timeoutMs,
    );
  }

  /**
   * Initializes the webpage API if necessary, or else just add the extension as a caller.
   */
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

    // Define the extension namespace on the window object
    Object.defineProperty(window, namespaceName, {
      value: namespace,
      writable: false,
      configurable: false,
      enumerable: true,
    });
  }

  init();
  console.log("API was initialized on the page.");
}
