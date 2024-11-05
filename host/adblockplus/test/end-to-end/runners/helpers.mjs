/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

/**
 * The manifest version passed as the command line arguments.
 * @returns {string}
 */
export function getManifestVersionArg() {
  return process.env.MANIFEST_VERSION || "3";
}

/**
 * Whether the browser should run with a manifest version 3 extension.
 * @returns {boolean}
 */
export function isMV3Arg() {
  return getManifestVersionArg() === "3";
}

/**
 * Whether the browser should run in headless mode.
 * @returns {boolean}
 */
export function isHeadlessArg() {
  return process.env.FORCE_HEADFUL !== "true";
}

/**
 * The browser name passed as the command line argument
 * @returns {string}
 */
export function getBrowserNameArg() {
  return process.env.BROWSER;
}

/**
 * Whether the browser is Chromium-based.
 * @returns {boolean}
 */
export function isChromiumArg() {
  const browserName = getBrowserNameArg();
  return browserName === "chromium" || browserName === "edge";
}

/**
 * Whether the browser is Edge.
 * @returns {boolean}
 */
export function isEdgeArg() {
  return getBrowserNameArg() === "edge";
}

/**
 * Whether the browser is Firefox.
 * @returns {boolean}
 */
export function isFirefoxArg() {
  return getBrowserNameArg() === "firefox";
}

export async function findExtensionPath(buildsDirPath) {
  const files = await fs.promises.readdir(buildsDirPath);

  let buildRegex;
  if (getManifestVersionArg() === "3") {
    buildRegex = /adblockplus-chrome-.*-mv3.zip/;
  } else if (getBrowserNameArg() === "edge") {
    buildRegex = /adblockplus-chrome-.*-mv2.zip/;
  } else {
    buildRegex = /adblockplus-firefox-.*-mv2.xpi/;
  }
  const [releaseFile] = files.filter((f) => buildRegex.test(f));

  if (!releaseFile) {
    throw new Error(`${buildRegex} was not found in ${buildsDirPath}`);
  }

  return path.join(buildsDirPath, releaseFile);
}

/**
 * Extracts the extension from the release folder based on the browser name
 *
 * @param {string} buildsDirPath - The path to the directory containing
 *    the extension builds
 * @param {string} unpackedDirPath - The path to the directory to extract
 *    the extension to
 * @returns {Promise<string>}
 */
export async function extractExtension(buildsDirPath, unpackedDirPath) {
  const extPath = await findExtensionPath(buildsDirPath);
  await fs.promises.rm(unpackedDirPath, { force: true, recursive: true });
  const zip = new AdmZip(extPath);
  zip.extractAllTo(unpackedDirPath, true);

  return unpackedDirPath;
}

/**
 * Reads the file and returns it as a base64 string
 *
 * @param {string} filePath - The path to the file to read
 * @returns {Promise<string>}
 */
export async function getFileAsBase64(filePath) {
  const extension = fs.readFileSync(filePath);
  return extension.toString("base64");
}

/**
 * Loads the Chromium extensions from the given paths.
 * @param {object} capabilities - The wdio capabilities object
 * @param {string[]} extensionPaths - The paths to the extensions to load
 */
export function loadChromiumExtensions(capabilities, extensionPaths = []) {
  const optionsKey =
    getBrowserNameArg() === "edge" ? "ms:edgeOptions" : "goog:chromeOptions";

  capabilities[optionsKey].args.push(
    `--load-extension=${extensionPaths.join(",")}`
  );
}
