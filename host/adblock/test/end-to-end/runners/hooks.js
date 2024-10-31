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

import fs from "fs";
import path from "path";
import { getScreenshotsPath } from "./constants.js";
import { findUrl } from "../utils/driver.js";
import { setOptionsHandle } from "../utils/hook.js";
import { extractExtension, getExtensionInfo, startBrowser } from "./helpers.js";

/**
 * Hook to set up the browser before the tests
 *
 * @param {string} buildsDirPath - The path to the directory containing the extension builds
 * @param {string} unpackedDirPath - The path to the directory to extract the extension to
 * @returns {Promise<void>}
 */
export async function setupBrowserHook(buildsDirPath, unpackedDirPath) {
  const extensionPath = await extractExtension(buildsDirPath, unpackedDirPath);

  const [driver, browserName, fullBrowserVersion, majorBrowserVersion] =
    await startBrowser(extensionPath);

  // Set global variables for the tests
  global.driver = driver;
  global.browserName = browserName;
  global.fullBrowserVersion = fullBrowserVersion;
  global.majorBrowserVersion = majorBrowserVersion;

  // [DEPRECATED]: Please use the global variables instead
  this.driver = driver;
  this.browserName = browserName;
  this.fullBrowserVersion = fullBrowserVersion;
  this.majorBrowserVersion = majorBrowserVersion;
}

/**
 * Hook to set up the browser before the tests
 *
 * @returns {Promise<void>}
 */
export async function prepareExtensionHook() {
  const { driver } = global;
  const { handle } = await findUrl(driver, "options.html", 6000);
  setOptionsHandle(handle);

  const { name, version, manifestVersion, origin, popupUrl } = await getExtensionInfo();
  console.log(`Extension: ${name} ${version} MV${manifestVersion}`);

  // Set global variables for the tests
  global.extOrigin = origin;
  global.extVersion = version;
  global.extName = name;
  global.popupUrl = popupUrl;
  global.manifestVersion = manifestVersion;

  // [DEPRECATED]: Please use the global variables instead
  this.origin = origin;
  this.popupUrl = popupUrl;
  this.manifestVersion = manifestVersion;
}

/**
 * Hook to take a screenshot after each test if the test failed
 *
 * @returns {Promise<void>}
 */
export async function screenshotsHook() {
  const { driver } = global;

  if (this.currentTest.state !== "failed") {
    return;
  }

  const data = await driver.takeScreenshot();
  const base64Data = data.replace(/^data:image\/png;base64,/, "");
  const title = this.currentTest.title.replaceAll(" ", "_");

  // ensure screenshots directory exists and write the screenshot to a file
  const screenshotsPath = getScreenshotsPath();
  await fs.promises.mkdir(screenshotsPath, { recursive: true });
  await fs.promises.writeFile(path.join(screenshotsPath, `${title}.png`), base64Data, "base64");
}

/**
 * Hook to clean up after the tests
 *
 * @returns {Promise<void>}
 */
export async function cleanupHook() {
  const { driver } = global;

  if (driver) {
    await driver.quit();
  }
}
