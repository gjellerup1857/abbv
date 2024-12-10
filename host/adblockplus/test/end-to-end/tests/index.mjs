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

import { afterSequence, beforeSequence } from "../helpers.js";
import smokeMain from "./test-smoke-main.mjs";
import uninstallDefault from "./smoke-main/uninstall-default.js";
import advancedTabFL from "./test-advanced-tab-filter-lists.mjs";
import flDropdown from "./test-built-in-filter-list-dropdown.mjs";
import optionsPageAA from "./test-options-page-acceptable-ads.mjs";
import popupMain from "./test-popup-main.mjs";
import freeUser from "./test-abp-premium-ui-free-user.mjs";
import publicAPI from "./public-api/index.mjs";
import unlockPremium from "./test-unlock-premium.mjs";
import eyeometry from "./test-eyeometry.mjs";
import youtubeAutoAllowlist from "./test-youtube-auto-allowlist.mjs";

export default () => {
  describe("Regular tests", function () {
    before(async function () {
      const { origin, optionsUrl, installedUrl, popupUrl, extVersion } =
        await beforeSequence({ expectInstalledTab: true, isSmokeTest: true });
      global.globalOrigin = origin;
      global.optionsUrl = optionsUrl;
      global.installedUrl = installedUrl;
      global.popupUrl = popupUrl;
      global.extVersion = extVersion;
    });

    beforeEach(async function () {
      await afterSequence();
    });

    describe("Smoke Tests - Main", smokeMain);
    describe("Advanced Tab - Filter Lists", advancedTabFL);
    describe("Filter List Dropdown - Default Filter Lists", flDropdown);
    describe("Options Page - General Tab Acceptable Ads", optionsPageAA);
    describe("Popup Tests - Main", popupMain);
    describe("Public API", publicAPI);
    describe("Premium - Free User", freeUser);
    describe("Premium - Unlock Premium", unlockPremium);
    describe("Eyeometry", eyeometry);
    describe("YouTube Auto-allowlist", youtubeAutoAllowlist);

    // Needs to be the last suite to run because the extension gets uninstalled
    describe("Uninstall with default settings", uninstallDefault);
  });
};
