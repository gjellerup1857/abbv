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

import { downloadLatestReleaseBuilds } from "@eyeo/test-utils";
import defineTestSuitesAfterUpgrade from "../suites-upgrade/index.js";
import { cleanupHook, prepareExtensionHook, screenshotsHook, setupBrowserHook } from "./hooks.js";
import { getBrowserNameArg, getManifestVersionArg } from "./constants.js";

// [IMPORTANT]: Set a unique runner ID
global.runnerId = "upgradeBuild";

describe("AdBlock upgrade end-to-end tests", function () {
  before(async function () {
    // This section downloads the browser, which could take a long time
    // depending on the internet connection speed. Best to disable the normal
    // timeout for this bit.
    this.timeout(0);

    // path to zip files from the latest released build
    const liveBuildsDirPath = path.join(process.cwd(), "dist", "live");
    const unpackedDirPath = path.join(liveBuildsDirPath, "adblock-upgrade-unpacked");
    try {
      await downloadLatestReleaseBuilds({
        extName: "adblock",
        browserName: getBrowserNameArg() === "firefox" ? "firefox" : "chrome",
        manifestVersion: getManifestVersionArg(),
        outputDirPath: liveBuildsDirPath,
      });
    } catch (e) {
      console.error("Unable to fetch the latest release builds", e);
    }

    // Start the browser with the extension.
    // Once the driver and other variables are moved on "global" object
    // we can remove the bind(this) from the setupBrowserHook
    await setupBrowserHook.bind(this)(liveBuildsDirPath, unpackedDirPath);
  });

  before(prepareExtensionHook);

  afterEach(screenshotsHook);
  after(cleanupHook);

  defineTestSuitesAfterUpgrade();
});
