// Read the extension name and version from manifest.json
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
