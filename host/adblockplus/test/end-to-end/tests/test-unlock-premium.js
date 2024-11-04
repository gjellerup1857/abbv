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

const {beforeSequence, globalRetriesNumber, enablePremiumByMockServer,
       enablePremiumByUI, getTabId} = require("../helpers");
const {expect} = require("chai");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const PopupPage = require("../page-objects/popup.page");
const TestPages = require("../page-objects/testPages.page");
let popupUrl;

describe("test unlock premium", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({popupUrl} = await beforeSequence());
  });

  it("should be able to activate premium", async function()
  {
    await enablePremiumByUI();
    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    expect(await premiumHeaderChunk.isPremiumHeaderDisplayed()).to.be.true;
    expect(await premiumHeaderChunk.
      isManageMySubscriptionButtonDisplayed()).to.be.true;
  });

  it("should have premium features", async function()
  {
    await enablePremiumByMockServer();
    await browser.newWindow("https://example.com");
    let popupPage = new PopupPage(browser);
    await popupPage.switchToTab("Example Domain");
    let tabId = await getTabId({title: "Example Domain"});
    await popupPage.init(popupUrl, tabId);
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleUnlocked()).to.be.true;
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.false;
    expect(await popupPage.
      isBlockMoreDistractionsToggleUnlocked()).to.be.true;
    expect(await popupPage.
      isBlockMoreDistractionsToggleSelected()).to.be.true;
    await popupPage.clickBlockCookieConsentPopupsToggle();
    await popupPage.clickCookieConsentPopupsPopupOkGotItButton();
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.true;
    await browser.newWindow("https://adblockinc.gitlab.io/QA-team/" +
      "adblocking/DC-filters/DC-filters-testpage.html");
    const testPages = new TestPages(browser);
    await testPages.switchToTab("DC filters");
    expect(await testPages.
      isPushNotificationsHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isPushNotificationsBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isAutoplayVideosHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isAutoplayVideosBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isSurveysHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isSurveysBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isNewsletterPopupsHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isNewsletterPopupsBlockingFilterIdDisplayed()).to.be.false;
  });
});
