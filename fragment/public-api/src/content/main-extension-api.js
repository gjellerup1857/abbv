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
 * @param {string} details.statusTriggerEvent The event type for triggering the get status call
 * @param {string} details.statusResponseEvent The event type for listening for the status response
 */
export function mainExtensionApi({
  allowlistingTriggerEvent,
  allowlistingResponseEvent,
  statusTriggerEvent,
  statusResponseEvent,
  extName,
}) {
  const API_VERSION = "1.0.0";
  const namespacePrefix = "extension_";
  const namespaceName = `${namespacePrefix}${extName}`;
  const extAllowlistingTriggerEvent = `${allowlistingTriggerEvent}.${extName}`;
  const extAllowlistingResponseEvent = `${allowlistingResponseEvent}.${extName}`;
  const extStatusTriggerEvent = `${statusTriggerEvent}.${extName}`;
  const extStatusResponseEvent = `${statusResponseEvent}.${extName}`;

  /**
   * Sends a command to the content script in the isolated world
   *
   * @param triggerEvent The event type to trigger
   * @param responseEvent The event type to listen on for the response
   * @param requestData The request payload
   * @returns {Promise<unknown>} The response from the content script
   */
  async function sendExtensionCommand({
    triggerEvent,
    responseEvent,
    requestData,
  }) {
    console.log("sent trigger event to content script", extName, requestData);

    return new Promise((resolve, reject) => {
      function eventHandler(event) {
        console.log(
          "received response from the extension in main world",
          event.type,
          event.detail,
        );

        document.removeEventListener(triggerEvent, eventHandler);
        resolve(event.detail);
      }

      document.addEventListener(responseEvent, eventHandler);

      document.dispatchEvent(
        new CustomEvent(triggerEvent, {
          detail: requestData,
        }),
      );
    });
  }

  /**
   * Sends a command to the extension to allowlist the current website
   *
   * @param {object} requestData The request data
   * @returns {Promise<unknown>} The response from the extension
   */
  async function allowlistWebsite(requestData) {
    const { requestId } = requestData;
    return sendExtensionCommand({
      triggerEvent: extAllowlistingTriggerEvent,
      responseEvent: `${extAllowlistingResponseEvent}.${requestId}`,
      requestData,
    });
  }

  /**
   * Sends a command to the extension to get the status of the current website
   *
   * @param {object} requestData The request data
   * @returns {Promise<unknown>} The response from the extension
   */
  async function getStatus(requestData) {
    const { requestId } = requestData;
    return sendExtensionCommand({
      triggerEvent: extStatusTriggerEvent,
      responseEvent: `${extStatusResponseEvent}.${requestId}`,
      requestData,
    });
  }

  const namespace = Object.freeze({
    API_VERSION,
    getStatus,
    allowlistWebsite,
  });

  /**
   * Initializes the webpage API if necessary, or else just add the extension as a caller.
   */
  function init() {
    const html = document.documentElement;
    const datasetName = extName.replace(/\s+/g, "");

    if (html.dataset[datasetName] === undefined) {
      const observer = new MutationObserver(() => {
        if (html.dataset[datasetName] === "true") {
          Object.defineProperty(window, namespaceName, {
            value: namespace,
            writable: false,
            configurable: false,
            enumerable: true,
          });
          observer.disconnect(); // Stop observing once the attribute is added
        }
      });

      // Start observing the <html> element for changes in its attributes
      observer.observe(html, { attributes: true });

      console.log(
        `The dataset attribute ${extName} does not exist. Waiting for it to be added.`,
      );
    } else {
      Object.defineProperty(window, namespaceName, {
        value: namespace,
        writable: false,
        configurable: false,
        enumerable: true,
      });
    }
  }

  init();
  console.log("API was initialized on the page.");
}
