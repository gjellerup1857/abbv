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

import { beforeEachTasks } from "../utils/hook.js";
import dataCollection from "./data-collection.js";
import smoke from "./smoke.js";
import uninstall from "./uninstall.js";
import optionsPageAA from "./options-page-aa.js";
import optionsPageFL from "./options-page-fl.js";
import getPremium from "./get-premium.js";
import popupAllowlisting from "./popup-allowlisting.js";
import popupPageOpensSettings from "./popup-page-opens-options.js";
import optionsPagePremiumFreeUser from "./options-page-premium-free-user.js";
import popupPagePremiumFreeUser from "./popup-page-premium-free-user.js";
import testServer from "./test-server.js";
import oneClickAllowlisting from "./public-api/one-click-allowlisting.js";
import bypassAPI from "./public-api/bypass-api.js";
import eyeometry from "./eyeometry.js";

export default () => {
  beforeEach(async function () {
    await beforeEachTasks(this.driver, this.origin);
  });

  describe("Test server", testServer);
  describe("Smoke Tests - Main", smoke);
  describe("Data collection", dataCollection);
  describe("Options Page", function () {
    describe("Acceptable Ads", optionsPageAA);
    describe("Filter Lists", optionsPageFL);
  });

  describe("Popup Page", function () {
    popupPageOpensSettings();
    describe("Allowlisting and disallowlisting", popupAllowlisting);
  });

  describe("Public API", function () {
    describe("One click allowlisting", oneClickAllowlisting);
    describe("Bypass API", bypassAPI);
  });

  describe("Premium", function () {
    describe("Free user - Options page", optionsPagePremiumFreeUser);
    describe("Free user - Popup page", popupPagePremiumFreeUser);
  });

  describe("Premium Tests", getPremium);
  describe("Telemetry", eyoemetry);

  // Needs to be the last suite to run because the extension gets uninstalled
  describe("Smoke Tests - Uninstall", uninstall);
};
