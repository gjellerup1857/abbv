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

import { downloadLatestReleaseBuilds, findProjectRoot } from "@eyeo/test-utils";
import {
  cleanupHook,
  seleniumScreenshotsHook,
  setupBrowserHook
} from "./hooks.mjs";
import { getBrowserNameArg, getManifestVersionArg } from "./helpers.mjs";
import createWdioPolyfill from "../polyfills/webdriverio-polyfill.mjs";
import testUpgradeScenarios from "../tests/upgrade/test-upgrade.mjs";

// [IMPORTANT]: Set a unique runner ID
global.runnerId = "upgradeBuild";

const rootPath = findProjectRoot();
const liveBuildsDirPath = path.join(rootPath, "dist", "live");

describe("Adblock Plus upgrade end-to-end tests", function () {
  before(async function () {
    // This section downloads the browser, which could take a long time
    // depending on the internet connection speed. Best to disable the normal
    // timeout for this bit.
    this.timeout(0);

    // path to zip files from the latest released build
    const unpackedDirPath = path.join(liveBuildsDirPath, "ext-unpacked");
    try {
      await downloadLatestReleaseBuilds({
        extName: "adblockplus",
        browserName: getBrowserNameArg() === "firefox" ? "firefox" : "chrome",
        manifestVersion: getManifestVersionArg(),
        outputDirPath: liveBuildsDirPath
      });
    } catch (e) {
      console.error("Unable to fetch the latest release builds", e);
    }

    // Start the browser with the extension.
    // Once the driver and other variables are moved on "global" object
    // we can remove the bind(this) from the setupBrowserHook
    await setupBrowserHook.bind(this)(liveBuildsDirPath, unpackedDirPath);

    // Import the polyfill after setupBrowserHook completes
    // This will make sure that previous tests (written for WebdriverIO) can
    // execute in the context of selenium-webdriver
    const { driver, browserName, fullBrowserVersion } = global;
    const [browser, $, $$] = createWdioPolyfill(
      driver,
      browserName,
      fullBrowserVersion
    );
    global.browser = browser;
    global.$ = $;
    global.$$ = $$;
  });

  afterEach(seleniumScreenshotsHook);
  after(cleanupHook);

  testUpgradeScenarios();
});
