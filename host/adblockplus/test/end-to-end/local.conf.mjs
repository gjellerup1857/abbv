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
import { findProjectRoot, testPagesPort } from "@eyeo/test-utils";
import { suites } from "./suites.js";
import * as firefox from "./runners/firefox.mjs";
import * as chromium from "./runners/chromium.mjs";
import { isChromiumArg, isEdgeArg, isFirefoxArg } from "./runners/helpers.mjs";
import {
  beforeHook,
  loadExtensionHook,
  screenshotHook
} from "./runners/hooks.mjs";

// Get the capabilities based on the browser argument
let capabilities = [chromium.capabilities];
if (isEdgeArg()) {
  capabilities = [chromium.edgeCapabilities];
} else if (isFirefoxArg()) {
  capabilities = [firefox.capabilities];
}

const rootPath = findProjectRoot();
const releasePath = path.join(rootPath, "dist", "release");

export const config = {
  suites,
  maxInstances: Number(process.env.MAX_INSTANCES) || 1,
  capabilities,
  logLevel: "error",
  logLevels: {
    webdriver: "silent",
    "@wdio/local-runner": "silent"
  },
  bail: 0,
  waitforTimeout: 10000,
  // connectionRetryTimeout is used on the initial browser instance loading
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: "mocha",
  reporters: [
    [
      "spec",
      {
        realtimeReporting: true,
        showPreface: false
      }
    ]
  ],
  mochaOpts: {
    ui: "bdd",
    timeout: 300000
  },
  // This is needed to enable DNS mapping for allowlisting
  // testpages.adblockplus.org is redirected to localhost
  services: [
    [
      "firefox-profile",
      {
        proxy: {
          proxyType: "pac",
          autoconfigUrl: `http://localhost:${testPagesPort}/proxy-config.pac`
        }
      }
    ]
  ],

  // =====
  // Hooks
  // =====
  /**
   * Gets executed before initializing the webdriver session and
   * test framework. It allows you to manipulate configurations depending
   * on the capability or spec.
   *
   * @param {object} wdioConfig - wdio configuration object
   * @param {Array.<Object>} wdioCapabilities - list of capabilities details
   * @param {Array.<String>} specs - List of spec file paths that are to be run
   */
  beforeSession: async (wdioConfig, wdioCapabilities, specs) => {
    if (isChromiumArg()) {
      await loadExtensionHook(wdioCapabilities, releasePath);
    }
  },

  /**
   * Gets executed before test execution begins. At this point you can access
   * to all global variables like `browser`. It is the perfect place to define
   * custom commands.
   *
   * @param {Array.<Object>} wdioCapabilities - List of capabilities details
   * @param {Array.<String>} specs - List of spec file paths that are to be run
   * @param {object} browser - Instance of created browser/device session
   * @returns {Promise<void>}
   */
  before: async (wdioCapabilities, specs, browser) => {
    await beforeHook();

    // Load the extension for Firefox
    if (isFirefoxArg()) {
      await loadExtensionHook(capabilities, releasePath);
    }
  },

  /**
   * Hook that gets executed _after_ every hook within the suite ends.
   * e.g. runs after `before`, `beforeEach`, `after`, `afterEach` in Mocha.
   */
  afterHook: screenshotHook,

  /**
   * Function to be executed after a test (in Mocha/Jasmine only)
   */
  afterTest: screenshotHook
};
