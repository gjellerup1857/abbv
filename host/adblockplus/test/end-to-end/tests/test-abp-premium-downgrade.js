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
  beforeSequence,
  enablePremiumByMockServer,
  getTabId,
  globalRetriesNumber,
  switchToABPOptionsTab
} = require("../helpers");
const { expect } = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const GeneralPage = require("../page-objects/general.page");
const PopupPage = require("../page-objects/popup.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");

describe("test abp premium downgrade", function () {
  let optionsUrl;
  let popupUrl;

  this.retries(globalRetriesNumber);

  before(async function () {
    ({ popupUrl, optionsUrl } = await beforeSequence());
  });

  it("should downgrade premium user", async function () {
    await enablePremiumByMockServer();

    const result = await browser.executeAsync(async (done) => {
      try {
        const response = await browser.runtime.sendMessage({
          type: "premium.activate",
          userId: "expired_user_id"
        });
        done(response);
      } catch (error) {
        done(error);
      }
    });
    if (result !== true) throw new Error(`premium.activate result: ${result}`);

    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    expect(await premiumHeaderChunk.isUpgradeButtonDisplayed(10000)).to.be.true;
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.isBlockCookieConsentPopupsItemDisplayed()).to.be
      .true;
    expect(await generalPage.isBlockCookieConsentPopupsCheckboxEnabled()).to.be
      .false;
    expect(await generalPage.isBlockMoreDistractionsItemDisplayed()).to.be.true;
    expect(await generalPage.isBlockMoreDistractionsCheckboxEnabled()).to.be
      .false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.isPremiumDistractionControlFLDisplayed(true)).to
      .be.true;
    await browser.newWindow("https://example.com");
    await advancedPage.switchToTab("Example Domain");
    const tabId = await getTabId({ title: "Example Domain" });
    const popupPage = new PopupPage(browser);
    await popupPage.init(popupUrl, tabId);
    expect(await popupPage.isUpgradeButtonDisplayed()).to.be.true;
    expect(await popupPage.isBlockCookieConsentPopupsLockIconDisplayed()).to.be
      .true;
    expect(await popupPage.isBlockMoreDistractionsLockIconDisplayed()).to.be
      .true;
    expect(await popupPage.isBlockCookieConsentPopupsToggleDisplayed()).to.be
      .false;
    expect(await popupPage.isBlockMoreDistractionsToggleDisplayed()).to.be
      .false;

    await switchToABPOptionsTab({ optionsUrl });
    expect(await premiumHeaderChunk.isUpgradeButtonDisplayed(10000)).to.be.true;
  });
});
