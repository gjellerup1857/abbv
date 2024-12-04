import path from "path";

/**
 * The browser name to use for the tests
 * @type {string}
 */
export function getBrowserNameArg() {
  return process.env.BROWSER || "chromium";
}

/**
 * The manifest version passed as command line argument
 *
 * @returns {string|string}
 */
export function getManifestVersionArg() {
  return process.env.MANIFEST_VERSION || "3";
}

// Screenshots folder path
export const screenshotsPath = path.join(process.cwd(), "test", "end-to-end", "screenshots");
