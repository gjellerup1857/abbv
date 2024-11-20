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
  waitForCondition,
  addFiltersToABP
} = require("../../helpers");
const { expect } = require("chai");
const PopupPage = require("../../page-objects/popup.page");
const TestPage = require("../../page-objects/testPages.page");
const AllowlistedWebsitesPage = require("../../page-objects/allowlistedWebsites.page");
const testData = require("../../test-data/data-smoke-tests");

module.exports = function () {
  let popupUrl;

  before(function () {
    popupUrl = this.test.parent.parent.popupUrl;
  });

  beforeEach(async function () {
    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToABP("/pop_ads.js");
  });

  it("should allow allowlisting from popup", async function () {
    const testPage = new TestPage(browser);
    await browser.newWindow(testData.blockHideUrl);
    await testPage.switchToTab("Blocking and hiding");
    const tabId = await getTabId({ title: "Blocking and hiding" });
    expect(await testPage.getPopadsFilterText()).to.include(
      "pop_ads.js was blocked"
    );
    expect(await testPage.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked"
    );
    expect(await testPage.isSearchAdDivDisplayed()).to.be.false;
    expect(await testPage.isAdContainerDivDisplayed()).to.be.false;
    const popupPage = new PopupPage(browser);
    await popupPage.init(popupUrl, tabId);
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.isDomainToggleChecked()).to.be.false;
    await popupPage.clickRefreshButton();

    await switchToABPOptionsTab({ switchToFrame: false });
    await testPage.switchToTab("Blocking and hiding");
    await browser.refresh();
    await waitForCondition(
      "getPopadsFilterText",
      3000,
      testPage,
      true,
      200,
      "pop_ads.js blocking filter should block this"
    );
    expect(await testPage.getPopadsFilterText()).to.include(
      "pop_ads.js blocking filter should block this"
    );
    expect(await testPage.getBanneradsFilterText()).to.include(
      "first bannerads/* blocking filter should block this"
    );
    expect(await testPage.getSearchAdDivText()).to.include(
      "search-ad id hiding filter should hide this"
    );
    expect(await testPage.getAdContainerDivText()).to.include(
      "AdContainer class hiding filter should hide this"
    );

    await switchToABPOptionsTab();
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    let attributesOfAllowlistingTableItems =
      await allowistedWebsitesPage.getAttributeOfAllowlistingTableItems(
        "class"
      );
    attributesOfAllowlistingTableItems.forEach(async (element) => {
      expect(element).to.equal("eyeo.gitlab.io");
    });
    await testPage.switchToTab("Blocking and hiding");
    await popupPage.init(popupUrl, tabId);
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.isDomainToggleChecked()).to.be.true;
    await popupPage.clickRefreshButton();
    await testPage.switchToTab("Blocking and hiding");
    await browser.refresh();
    expect(await testPage.getPopadsFilterText()).to.include(
      "pop_ads.js was blocked"
    );
    expect(await testPage.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked"
    );
    expect(await testPage.isSearchAdDivDisplayed()).to.be.false;
    expect(await testPage.isAdContainerDivDisplayed()).to.be.false;

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
