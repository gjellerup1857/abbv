/* eslint-disable quote-props */
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

import path from "path";
import { downloadLatestReleaseBuilds, findProjectRoot } from "@eyeo/test-utils";
import { config as baseConfig } from "./local-base.conf.mjs";
import { beforeHook, loadExtensionHook } from "./runners/hooks.mjs";
import { reloadExtension } from "./helpers.js";
import {
  extractExtension,
  getBrowserNameArg,
  getManifestVersionArg,
  isChromiumArg,
  isFirefoxArg
} from "./runners/helpers.mjs";

const rootPath = findProjectRoot();
const releasePath = path.join(rootPath, "dist", "release");
const liveBuildsDirPath = path.join(rootPath, "dist", "live");

// Although we're skipping the test, the CI pipeline fails on Firefox,
// so we need to exit the process to avoid the failure.
// Firefox does not support upgrading the extension, anyway.
if (isFirefoxArg()) {
  console.error("Firefox does not support extension upgrades!");
  process.exit(0);
}

export const config = {
  ...baseConfig,

  // For overriding the base config, take care of nested objects.
  // It might be useful to use "deepmerge" utility.
  // https://www.npmjs.com/package/deepmerge
  // https://webdriver.io/docs/organizingsuites/#inherit-from-main-config-file
  // suites: [...],

  /**
   * Gets executed once before all workers get launched.
   *
   * @param {object} wdioConfig - wdio configuration object
   * @param {Array.<Object>} capabilities - list of capabilities details
   */
  onPrepare: async (wdioConfig, capabilities) => {
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
  },

  beforeSession: async (wdioConfig, wdioCapabilities, specs) => {
    if (isChromiumArg()) {
      await loadExtensionHook(wdioCapabilities, liveBuildsDirPath);
    }
  },

  before: async (wdioCapabilities, specs, browser) => {
    await beforeHook();

    if (isFirefoxArg()) {
      // Firefox does not support upgrading the extension
      await loadExtensionHook(wdioCapabilities, releasePath);
    }

    // Adding a new command to upgrade the extension
    // See: https://webdriver.io/docs/extension-testing/web-extensions#tips--tricks
    browser.addCommand("upgradeExtension", async () => {
      if (isFirefoxArg()) {
        throw new Error("Firefox does not support extension upgrades!");
      }

      const unpackedDirPath = path.join(liveBuildsDirPath, "ext-unpacked");
      await extractExtension(releasePath, unpackedDirPath);

      // reload the extension after upgrading
      await reloadExtension();
    });
  }
};
