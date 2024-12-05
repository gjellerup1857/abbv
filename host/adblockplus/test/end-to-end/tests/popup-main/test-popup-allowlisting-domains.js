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

"use strict";

const {
  getTabId,
  switchToABPOptionsTab,
  addFiltersToABP
} = require("../../helpers");
const { expect } = require("chai");
const PopupPage = require("../../page-objects/popup.page");
const TestPages = require("../../page-objects/testPages.page");
const AllowlistedWebsitesPage = require("../../page-objects/allowlistedWebsites.page");
const testData = require("../../test-data/data-smoke-tests");

module.exports = function () {
  let popupUrl;

  before(function () {
    ({ popupUrl } = global);
  });

  beforeEach(async function () {
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToABP(testData.customBlockingFilters.join("\n"));
  });

  it("should allow allowlisting from popup", async function () {
    const testPages = new TestPages(browser);

    await browser.newWindow(testData.blockHideUrl);
    await testPages.switchToTab("Blocking and hiding");
    const tabId = await getTabId({ title: "Blocking and hiding" });
    await testPages.checkPage({ expectAllowlisted: false });

    const popupPage = new PopupPage(browser);
    await popupPage.init(popupUrl, tabId);
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.isDomainToggleChecked()).to.be.false;
    await popupPage.clickRefreshButton();

    await switchToABPOptionsTab({ switchToFrame: false });
    await testPages.switchToTab("Blocking and hiding");
    await testPages.checkPage({ expectAllowlisted: true });

    await switchToABPOptionsTab();
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    let attributesOfAllowlistingTableItems =
      await allowistedWebsitesPage.getAttributeOfAllowlistingTableItems(
        "aria-label"
      );
    attributesOfAllowlistingTableItems.forEach(async (element) => {
      expect(element).to.equal("localhost");
    });
    await testPages.switchToTab("Blocking and hiding");
    await popupPage.init(popupUrl, tabId);
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.isDomainToggleChecked()).to.be.true;
    await popupPage.clickRefreshButton();
    await testPages.switchToTab("Blocking and hiding");
    await testPages.checkPage({ expectAllowlisted: false });

    await switchToABPOptionsTab();
    await allowistedWebsitesPage.init();
    attributesOfAllowlistingTableItems =
      await allowistedWebsitesPage.getAttributeOfAllowlistingTableItems(
        "class"
      );
    attributesOfAllowlistingTableItems.forEach(async (element) => {
      expect(element).to.equal("empty-placeholder");
    });
  });
};
