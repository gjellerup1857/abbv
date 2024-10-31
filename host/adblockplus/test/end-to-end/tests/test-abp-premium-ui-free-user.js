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

const {beforeSequence, getTabId, switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const GeneralPage = require("../page-objects/general.page");
const HelpPage = require("../page-objects/help.page");
const PopupPage = require("../page-objects/popup.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
let popupUrl;

describe("test abp premium ui - free user", function()
{
  before(async function()
  {
    ({popupUrl} = await beforeSequence());
  });

  it("should display correct UI for a free user", async function()
  {
    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    expect(await premiumHeaderChunk.isPremiumHeaderDisplayed()).to.be.true;
    expect(await premiumHeaderChunk.getPremiumUpgradeText()).to.
      include("Customize and enhance your adblocking experience!");
    expect(await premiumHeaderChunk.
      isLearnMorePremiumLinkDisplayed()).to.be.true;
    expect(await premiumHeaderChunk.isUpgradeButtonDisplayed()).to.be.true;
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.isPremiumSectionHeaderDisplayed()).to.be.true;
    expect(await generalPage.isUpgradeButtonGeneralDisplayed()).to.be.true;
    expect(await generalPage.
      isBlockCookieConsentPopupsItemDisplayed()).to.be.true;
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxEnabled()).to.be.false;
    expect(await generalPage.
      isBlockMoreDistractionsItemDisplayed()).to.be.true;
    expect(await generalPage.
      isBlockMoreDistractionsCheckboxEnabled()).to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await premiumHeaderChunk.isPremiumHeaderDisplayed()).to.be.true;
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    expect(await premiumHeaderChunk.isPremiumHeaderDisplayed()).to.be.true;
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    expect(await premiumHeaderChunk.isPremiumHeaderDisplayed()).to.be.true;
    await browser.newWindow("https://example.com");
    await advancedPage.switchToTab("Example Domain");
    const tabId = await getTabId({title: "Example Domain"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(popupUrl, tabId);
    expect(await popupPage.isUpgradeButtonDisplayed()).to.be.true;
    expect(await popupPage.
      isBlockCookieConsentPopupsTitleDisplayed()).to.be.true;
    expect(await popupPage.
      isBlockCookieConsentPopupsLockIconDisplayed()).to.be.true;
    expect(await popupPage.
      isBlockMoreDistractionsTitleDisplayed()).to.be.true;
    expect(await popupPage.
      isBlockMoreDistractionsLockIconDisplayed()).to.be.true;
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleDisplayed()).to.be.false;
    expect(await popupPage.
      isBlockMoreDistractionsToggleDisplayed()).to.be.false;
    await browser.closeWindow();
    await switchToABPOptionsTab();
  });
});
