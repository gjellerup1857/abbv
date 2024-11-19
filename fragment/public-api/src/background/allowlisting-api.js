// Read the extension name and version from manifest.json
import { allowlistingTriggerEvent, apiFrameUrl } from "../shared/constants.js";

const { short_name: extName, version: extVersion } =
  browser.runtime.getManifest();

/**
 * Handles the allowlisting of a website
 *
 * @param {Object} params - Input parameter
 * @param {Object} params.allowlistingOptions The allowlisting options sent from the content script.
 * @param {Object} params.sender The sender object
 * @returns {Promise<any>} The result of the allowlisting command
 */
export async function handleAllowlisting({ allowlistingOptions, sender }) {
  // TODO: add implementation
  const responses = [
    {
      name: extName,
      success: true,
    },
    {
      name: extName,
      success: false,
      reason: "Failed in the background script",
    },
  ];

  // Randomly pick one of the two responses
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

/**
 * Initializes the API
 *
 * @param {any} port A reference to the port object
 * @param {Function} addTrustedMessageTypes Function to add the trusted message types
 */
export function start({ port, addTrustedMessageTypes }) {
  port.on(allowlistingTriggerEvent, async (message, sender) =>
    handleAllowlisting({ allowlistingOptions: message, sender }),
  );

  addTrustedMessageTypes(apiFrameUrl, [allowlistingTriggerEvent]);
}
