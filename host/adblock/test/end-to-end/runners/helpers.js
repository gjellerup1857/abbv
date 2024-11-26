/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2024-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-console */
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { BROWSERS, getMajorVersion } from "@eyeo/get-browser-binary";
import {
  getBrowserNameArg,
  getManifestVersionArg,
  getScreenshotsPath,
  screenshotsBasePath,
} from "./constants.js";
import { reloadExtension } from "../utils/page.js";
import { sleep, changeExtensionVersion } from "@eyeo/test-utils";

/**
 * Extracts the extension from the release folder based on the browser name
 *
 * @param {string} buildsDirPath - The path to the directory containing the extension builds
 * @param {string} unpackedDirPath - The path to the directory to extract the extension to
 * @returns {Promise<string>}
 */
export async function extractExtension(buildsDirPath, unpackedDirPath) {
  const files = await fs.promises.readdir(buildsDirPath);

  let buildRegex;
  if (getManifestVersionArg() === "3") {
    buildRegex = /adblock-chrome-.*-mv3.zip/;
  } else if (getBrowserNameArg() === "edge") {
    buildRegex = /adblock-chrome-.*-mv2.zip/;
  } else {
    buildRegex = /adblock-firefox-.*-mv2.xpi/;
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
 * Replacing the extension files with the current build files, and reload the extension
 * @returns {Promise<void>}
 */
export async function upgradeExtension() {
  // replace the contents of the extension with the files from the current builds
  const buildsDirPath = path.join(process.cwd(), "dist", "release");
  const unpackedDirPath = path.join(process.cwd(), "dist", "live", "adblock-upgrade-unpacked");
  await extractExtension(buildsDirPath, unpackedDirPath);

  // Change the extension version to check the upgrade mechanism works
  await changeExtensionVersion(unpackedDirPath);

  // reload the extension
  await reloadExtension();

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

/**
 * Starts the browser with the extension installed
 *
 * @param {string} extensionPath - The path to the extension to install
 * @param {number} retry - The number of times to retry starting the browser
 * @returns {Promise<(*|string|string|(function(): *)|number)[]>}
 */
export async function startBrowser(extensionPath, retry = 0) {
  const version = "latest";
  const browserName = getBrowserNameArg();

  try {
    const { versionNumber } = await BROWSERS[browserName].installBrowser(version);
    console.log(`Installed ${browserName} ${versionNumber} ...`);

    const extensionPaths = [
      path.join(process.cwd(), "dist", "devenv", "helper-extension"),
      extensionPath,
    ];
    const headless = process.env.FORCE_HEADFUL !== "true";

    let options;
    let extraArgs;
    if (browserName === "firefox") {
      extraArgs = ["-width=1400", "-height=1000"];
      // EXT-497: we need to bind "testpages.adblockplus.org" to "localhost"
      // to be able to test with locally hosted page. For FF we use PAC file
      // to set proxy
      const proxy = "http://localhost:3005/proxy-config.pac";
      options = { headless, extensionPaths, extraArgs, proxy };
    } else {
      extraArgs = [
        "--window-size=1400,1000",
        // EXT-497: we need to bind "testpages.adblockplus.org" to "localhost"
        // to be able to test with locally hosted page.
        "--host-resolver-rules=MAP testpages.adblockplus.org 127.0.0.1",
        "--ignore-certificate-errors",
        "--disable-search-engine-choice-screen",
      ];
      options = { headless, extensionPaths, extraArgs };
    }

    const driver = await BROWSERS[browserName].getDriver(version, options);

    const cap = await driver.getCapabilities();
    const browserVersion = cap.getBrowserVersion();
    console.log(`Browser: ${cap.getBrowserName()} ${browserVersion}`);

    return [driver, browserName, browserVersion, getMajorVersion(browserVersion)];
  } catch (e) {
    if (retry < 5) {
      console.warn(`Failed to start the browser, retrying (${retry})...`);
      await sleep(1000);
      return startBrowser(extensionPath, retry + 1);
    }

    throw e;
  }
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
 * Takes a screenshot of the current page
 *
 * @param {string} title - The title of the screenshot image without the extension
 */
export async function screenshot(title) {
  const data = await driver.takeScreenshot();
  const base64Data = data.replace(/^data:image\/png;base64,/, "");

  // ensure screenshots directory exists and write the screenshot to a file
  const screenshotsPath = getScreenshotsPath();
  await fs.promises.mkdir(screenshotsPath, { recursive: true });
  await fs.promises.writeFile(path.join(screenshotsPath, `${title}.png`), base64Data, "base64");
}

// Removes the screenshots base folder
export async function removeScreenshots() {
  await fs.promises.rm(screenshotsBasePath, { recursive: true, force: true });
}
