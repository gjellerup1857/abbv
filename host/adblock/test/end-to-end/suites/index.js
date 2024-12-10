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
import dataCollection from "./data-collection/data-collection.js";
import extension from "./smoke/extension.js";
import adFiltering from "./smoke/ad-filtering.js";
import uninstall from "./smoke/uninstall.js";
import optionsPageAA from "./options-page/acceptable-ads.js";
import optionsPageFL from "./options-page/filter-lists.js";
import getPremium from "./premium/get-premium.js";
import popupPage from "./popup-page.js";
import freeUserOptions from "./premium/free-user-options.js";
import freeUserPopup from "./premium/free-user-popup.js";
import testServer from "./test-server.js";
import oneClickAllowlisting from "./public-api/one-click-allowlisting.js";
import bypassAPI from "./public-api/bypass-api.js";
import eyeometry from "./data-collection/eyeometry.js";
import youtubeAutoAllowlist from "./youtube-auto-allowlist.js";

export default () => {
  beforeEach(async function () {
    await beforeEachTasks();
  });

  describe("Test Server", testServer);

  describe("Smoke Tests - Main", function () {
    describe("Extension", extension);
    describe("Ad Filtering", adFiltering);
  });

  describe("Popup Page", popupPage);

  describe("Options Page", function () {
    describe("Acceptable Ads", optionsPageAA);
    describe("Filter Lists", optionsPageFL);
  });

  describe("Data Collection", function () {
    dataCollection();
    describe("Eyeometry", eyeometry);
  });

  describe("YouTube auto-allowlist", youtubeAutoAllowlist);

  describe("Public API", function () {
    describe("One click allowlisting", oneClickAllowlisting);
    describe("Bypass API", bypassAPI);
  });

  describe("Premium", function () {
    describe("Free user - Popup", freeUserPopup);
    describe("Free user - Options", freeUserOptions);
    describe("Premium user", getPremium);
  });

  // Needs to be the last suite to run because the extension gets uninstalled
  describe("Smoke Tests - Uninstall", uninstall);
};
