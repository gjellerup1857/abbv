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

import defineTestSuites from "../suites/index.js";
import { cleanupHook, prepareExtensionHook, screenshotsHook, setupBrowserHook } from "./hooks.js";

// [IMPORTANT]: Set a unique runner ID
global.runnerId = "currentBuild";

describe("AdBlock end-to-end tests", function () {
  before(async function () {
    // This section downloads the browser, which could take a long time
    // depending on the internet connection speed. Best to disable the normal
    // timeout for this bit.
    this.timeout(0);

    // path to zip files from the current build
    const buildsDirPath = path.join(process.cwd(), "dist", "release");
    const unpackedDirPath = path.join(buildsDirPath, "adblock-unpacked");

    // Start the browser with the extension.
    await setupBrowserHook(buildsDirPath, unpackedDirPath);
  });

  before(prepareExtensionHook);

  afterEach(screenshotsHook);
  after(cleanupHook);

  defineTestSuites();
});
