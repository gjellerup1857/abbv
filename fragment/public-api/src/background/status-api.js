// Read the extension name and version from manifest.json
const { short_name: extName, version: extVersion } =
  browser.runtime.getManifest();

/**
 * Retrieves the allowlisting status of a tab
 *
 * @param {Object} params - Input parameter
 * @param {number} params.tabId The id of the tab
 * @param {any} params.ewe The filter engine
 * @returns {Promise<any>} The allowlisting state for the current tab
 */
export async function getAllowlistStatus({ tabId, ewe }) {
  const allowlistingFilters = await ewe.filters.getAllowingFilters(tabId);
  let source = null;

  for (const filter of allowlistingFilters) {
    // eslint-disable-next-line no-await-in-loop
    const metadata = await ewe.filters.getMetadata(filter);
    const { origin } = metadata ?? {};

    if (origin === "web") {
      source = "1ca";
      break;
    } else {
      source = "user";
      // Don't break here, continue searching in case there's a "web" origin
    }
  }

  return {
    status: allowlistingFilters.length > 0,
    source,
    oneCA: true,
  };
}

/**
 * Retrieves the extension status
 *
 * @param {Object} params - Input parameter
 * @param {number} params.tabId The id of the tab
 * @param {any} params.ewe The filter engine
 * @param {Function} params.isPremiumActive Function to check if premium is active
 * @param {Function} params.getEncodedLicense Function to retrieve the encoded license for validation
 * @returns {Promise<any>} The extension status info
 */
export async function getExtensionStatus({
  tabId,
  ewe,
  isPremiumActive,
  getEncodedLicense,
}) {
  const allowlistState = await getAllowlistStatus({ tabId, ewe });

  const premiumState = isPremiumActive();
  const payload = premiumState.isActive ? getEncodedLicense() : null;

  const extensionInfo = {
    name: extName,
    version: extVersion,
    allowlistState,
  };

  return { payload, extensionInfo };
}
