/*
 * This file is part of Web Extensions Core Utilities (Web Extensions CU),
 * Copyright (C) 2024-present eyeo GmbH
 *
 * Web Extensions CU is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Web Extensions CU is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Web Extensions CU.  If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-console */
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

let optionsHandle;

/**
 * Sets the Options page handle
 *
 * @param {string} handle - Selenium window handle pointing to the Options page tab
 */
export function setOptionsHandle(handle) {
  optionsHandle = handle;
}

/**
 * Gets the Selenium window handle pointing to the Options page tab
 *
 * @returns {string}
 */
export function getOptionsHandle() {
  return optionsHandle;
}

/**
 * Extracts the extension from the release folder based on the browser name
 *
 * @param {string} buildsDirPath - The path to the directory containing the extension builds
 * @param {string} unpackedDirPath - The path to the directory to extract the extension to
 * @returns {Promise<string>}
 */
export async function extractExtension(buildsDirPath, unpackedDirPath) {
  const files = await fs.promises.readdir(buildsDirPath);
  const { browserName, manifestVersion, hostname } = global.config;

  let buildRegex;
  if (manifestVersion === "3") {
    buildRegex = new RegExp(`${hostname}-chrome-.*-mv3.zip`);
  } else if (browserName === "edge") {
    buildRegex = new RegExp(`${hostname}-chrome-.*-mv2.zip`);
  } else {
    buildRegex = new RegExp(`${hostname}-firefox-.*-mv2.xpi`);
  }
  const [releaseFile] = files.filter((f) => buildRegex.test(f));

  if (!releaseFile) {
    throw new Error(`${buildRegex} was not found in ${buildsDirPath}`);
  }

  await fs.promises.rm(unpackedDirPath, { force: true, recursive: true });
  const zip = new AdmZip(path.join(buildsDirPath, releaseFile));
  zip.extractAllTo(unpackedDirPath, true);

  return unpackedDirPath;
}

/**
 * Gets the extension info
 *
 * @returns {Promise<{origin}|awaited !IThenable<T>|*|Promise<*>>}
 */
export async function getExtensionInfo() {
  const info = await driver.executeAsyncScript(async (callback) => {
    if (typeof browser !== "undefined" && browser.management !== "undefined") {
      const { shortName, version, permissions, optionsUrl } = await browser.management.getSelf();
      const origin = optionsUrl ? location.origin : null;
      const manifest = await browser.runtime.getManifest();
      const popupPath =
        manifest.manifest_version == "3"
          ? manifest.action.default_popup
          : manifest.browser_action.default_popup;
      const popupUrl = manifest.applications?.gecko ? popupPath : `${origin}/${popupPath}`;
      callback({ name: shortName, version, origin, permissions, popupUrl });
    } else {
      callback({});
    }
  });

  if (!info || !info.origin) {
    throw new Error("Origin was not found");
  }

  info.manifestVersion = 2;
  if (
    info.permissions.includes("declarativeNetRequest") ||
    info.permissions.includes("declarativeNetRequestWithHostAccess")
  ) {
    info.manifestVersion = 3;
  }

  return info;
}

/**
 * Changes the extension version in the manifest.json file from "x.x.x[.x]"
 * to "x.x.x.{patch}"
 *
 * @param {string} unpackedDirPath - Path to the unpacked extension folder
 * @param {string} patch - Patch number asigned to the new extension version
 * @returns {Promise<void>}
 */
export async function changeExtensionVersion(unpackedDirPath, patch = "9999") {
  const manifestFile = path.join(unpackedDirPath, "manifest.json");
  const content = JSON.parse(await fs.promises.readFile(manifestFile));

  const [major, minor, hotfix] = content.version.split(".");
  content.version = `${major}.${minor}.${hotfix}.${patch}`;

  await fs.promises.writeFile(manifestFile, JSON.stringify(content, null, 2));
}

/**
 * Replaces the extension files with the current build files, and reloads the extension
 * @param {Function} reloadExtensionFn - Function that reloads the extension, specific to each host
 * @returns {Promise<void>}
 */
export async function upgradeExtension(reloadExtensionFn) {
  const { buildsDirPath, unpackedUpgradeDirPath } = global.config;
  console.log({ buildsDirPath, unpackedUpgradeDirPath });

  // replace the contents of the extension with the files from the current builds
  await extractExtension(buildsDirPath, unpackedUpgradeDirPath);

  // Change the extension version to check the upgrade mechanism works
  await changeExtensionVersion(unpackedUpgradeDirPath);

  // reload the extension
  await reloadExtensionFn();

  // update the extension info on global
  const { name, version, manifestVersion, origin, popupUrl } = await getExtensionInfo();
  console.log(`Upgraded extension: ${name} ${version} MV${manifestVersion}`);

  // Reset global extension properties for the tests. Needs to be in sync with `setupBrowserHook`
  global.extension = {
    name,
    manifestVersion,
    origin,
    version,
    popupUrl,
  };
}
