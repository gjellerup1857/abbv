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
    const popupPage = new PopupPage(browser);
    await popupPage.switchToTab("Example Domain");
    const tabId = await getTabId({title: "Example Domain"});
    await popupPage.init(popupUrl, tabId);
    const expectedToggleValues = {
      blockCookieConsentPopupsToggleUnlocked: true,
      blockCookieConsentPopupsToggleSelected: false,
      blockMoreDistractionsToggleUnlocked: true,
      blockMoreDistractionsToggleSelected: true
    }
    const actualToggleValues = Object.fromEntries(await Promise.all([
      ["blockCookieConsentPopupsToggleUnlocked", await popupPage.isBlockCookieConsentPopupsToggleUnlocked()],
      ["blockCookieConsentPopupsToggleSelected", await popupPage.isBlockCookieConsentPopupsToggleSelected()],
      ["blockMoreDistractionsToggleUnlocked", await popupPage.isBlockMoreDistractionsToggleUnlocked()],
      ["blockMoreDistractionsToggleSelected", await popupPage.isBlockMoreDistractionsToggleSelected()]
    ]));
    expect(expectedToggleValues).to.deep.equal(actualToggleValues);
    await popupPage.clickBlockCookieConsentPopupsToggle();
    await popupPage.clickCookieConsentPopupsPopupOkGotItButton();
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.true;
    await browser.newWindow("http://testpages.adblockplus.org:3005/dc-filters.html");
    const testPages = new TestPages(browser);
    await testPages.switchToTab("DC filters");
    
    const expectedFilterValues = {
      pushNotificationsHidingFilterDisplayed: false,
      pushNotificationsBlockingFilterDisplayed: false,
      autoplayVideosHidingFilterDisplayed: false,
      autoplayVideosBlockingFilterDisplayed: false,
      surveysHidingFilterDisplayed: false,
      surveysBlockingFilterDisplayed: false,
      newsletterPopupsHidingFilterDisplayed: false,
      newsletterPopupsBlockingFilterDisplayed: false,
    };
    const actualFilterValues = Object.fromEntries(await Promise.all([
      ["pushNotificationsHidingFilterDisplayed", await testPages.isPushNotificationsHidingFilterIdDisplayed()],
      ["pushNotificationsBlockingFilterDisplayed", await testPages.isPushNotificationsBlockingFilterIdDisplayed()],
      ["autoplayVideosHidingFilterDisplayed", await testPages.isAutoplayVideosHidingFilterIdDisplayed()],
      ["autoplayVideosBlockingFilterDisplayed", await testPages.isAutoplayVideosBlockingFilterIdDisplayed()],
      ["surveysHidingFilterDisplayed", await testPages.isSurveysHidingFilterIdDisplayed()],
      ["surveysBlockingFilterDisplayed", await testPages.isSurveysBlockingFilterIdDisplayed()],
      ["newsletterPopupsHidingFilterDisplayed", await testPages.isNewsletterPopupsHidingFilterIdDisplayed()],
      ["newsletterPopupsBlockingFilterDisplayed", await testPages.isNewsletterPopupsBlockingFilterIdDisplayed()]
    ]));
    expect(actualFilterValues).to.deep.equal(expectedFilterValues);
  });
});
