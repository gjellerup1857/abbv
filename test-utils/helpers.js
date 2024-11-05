import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

/**
 * Sleep for a given amount of time
 *
 * @param {number} ms - The time to sleep in milliseconds
 * @returns {Promise<unknown>}
 */
export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Finds the project root directory by looking for a package.json file.
 *
 * @param {string} [startDir] - The directory to start looking in
 * @param {string} [lookupFile="package.json"] - The file to look for in the directory
 * @returns {string|*}
 */
export function findProjectRoot(startDir = process.cwd(), lookupFile = "package.json") {
  // Convert the directory to an absolute path, and resolve the lookup file path.
  const dir = path.resolve(startDir);

  if (fs.existsSync(path.resolve(dir, lookupFile))) {
    return dir;
  }

  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    throw new Error("Project root not found");
  }

  return findProjectRoot(parentDir);
}

/**
 * Downloads a file from a URL and saves it to the output path
 *
 * @param {string} url - The URL to download the file from
 * @param {string} outputPath - The path to save the file to
 * @returns {Promise<void>}
 */
async function downloadFile(url, outputPath) {
  console.log(`Downloading ${url} to ${outputPath} ...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const fileStream = fs.createWriteStream(outputPath);
  await pipeline(response.body, fileStream);
}

/**
 * Downloads the latest release builds from Gitlab
 *
 * @param {string} extName - The name of the extension e.g. adblock or adblockplus
 * @param {string} browserName - The name of the browser
 * @param {number|string} manifestVersion - The manifest version
 * @param {string} outputDirPath - The path to the directory to save the builds
 * @returns {Promise<void>}
 */
export async function downloadLatestReleaseBuilds({ extName, browserName = "chrome", manifestVersion = 3, outputDirPath }) {
  // make sure that the output directory exists
  await fs.promises.mkdir(outputDirPath, { recursive: true });

  const res = await fetch("https://gitlab.com/api/v4/projects/59518842/releases");
  if (!res.ok) {
    throw new Error(`Failed to fetch to Gitlab Releases API: ${res.statusText}`);
  }

  const releases = await res.json();
  if (releases.length === 0) {
    throw new Error("No releases found");
  }

  let latestRelease = null;
  for (const release of releases) {
    // if not an adblock release, skip
    if (!release.tag_name.startsWith(`${extName}-`)) {
      continue;
    }

    // if first adblock release, set it as latest
    if (!latestRelease) {
      latestRelease = release;
      continue;
    }

    // if release date is newer than latest adblock release, set it as latest
    const releaseDate = new Date(release.created_at);
    if (releaseDate > new Date(latestRelease.created_at)) {
      latestRelease = release;
    }
  }

  if (!latestRelease) {
    throw new Error(`No releases found for extension "${extName}"`);
  }

  const promises = [];
  for (const link of latestRelease.assets.links) {
    const fileName = link.name;
    if (fileName.includes(browserName) && fileName.includes(`mv${manifestVersion}`)) {
      console.log(`Downloading ${fileName}...`);
      promises.push(downloadFile(link.url, path.join(outputDirPath, link.name)));
    }
  }
  await Promise.all(promises);
}

/**
 * Converts an array buffer byte array into a base64 string.
 *
 * @param {Uint8Array|ArrayBuffer} buffer - Byte array of any data.
 * @return {string} The same data, encoded as a base64 string.
 */
export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
