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

import { expect } from "chai";

import {
  enablePremiumByMockServer,
  enablePremiumByUI,
  getTabId,
  isFirefox
} from "../helpers.js";
import PremiumHeaderChunk from "../page-objects/premiumHeader.chunk.js";
import PopupPage from "../page-objects/popup.page.js";
import TestPages from "../page-objects/testPages.page.js";

let popupUrl;

export default () => {
  before(async function () {
    ({ popupUrl } = global);
  });

  it("should be able to activate premium", async function () {
    // https://eyeo.atlassian.net/browse/EXT-608
    if (isFirefox()) this.skip();

    await enablePremiumByUI();
    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    expect(await premiumHeaderChunk.isPremiumHeaderDisplayed()).to.be.true;
    expect(await premiumHeaderChunk.isManageMySubscriptionButtonDisplayed()).to
      .be.true;
  });

  it("should have premium features", async function () {
    await enablePremiumByMockServer();
    await browser.newWindow("https://example.com");
    const popupPage = new PopupPage(browser);
    await popupPage.switchToTab("Example Domain");
    const tabId = await getTabId({ title: "Example Domain" });
    await popupPage.init(popupUrl, tabId);
    const expectedToggleValues = {
      blockCookieConsentPopupsToggleUnlocked: true,
      blockCookieConsentPopupsToggleSelected: false,
      blockMoreDistractionsToggleUnlocked: true,
      blockMoreDistractionsToggleSelected: true
    };
    const actualToggleValues = Object.fromEntries(
      await Promise.all([
        [
          "blockCookieConsentPopupsToggleUnlocked",
          await popupPage.isBlockCookieConsentPopupsToggleUnlocked()
        ],
        [
          "blockCookieConsentPopupsToggleSelected",
          await popupPage.isBlockCookieConsentPopupsToggleSelected()
        ],
        [
          "blockMoreDistractionsToggleUnlocked",
          await popupPage.isBlockMoreDistractionsToggleUnlocked()
        ],
        [
          "blockMoreDistractionsToggleSelected",
          await popupPage.isBlockMoreDistractionsToggleSelected()
        ]
      ])
    );
    expect(expectedToggleValues).to.deep.equal(actualToggleValues);
    try {
      await popupPage.clickBlockCookieConsentPopupsToggle();
    } catch (e) {
      // If the above click does not work, it means Premium was not enabled
      await enablePremiumByMockServer();
      await popupPage.init(popupUrl, tabId);
      await popupPage.clickBlockCookieConsentPopupsToggle();
    }
    try {
      await popupPage.clickCookieConsentPopupsPopupOkGotItButton();
    } catch (e) {
      // The Cookie consent toggle might not be selected
      if (await popupPage.isBlockCookieConsentPopupsToggleSelected()) {
        await popupPage.clickBlockCookieConsentPopupsToggle();
      }
      await popupPage.clickCookieConsentPopupsPopupOkGotItButton();
    }
    expect(await popupPage.isBlockCookieConsentPopupsToggleSelected()).to.be
      .true;
    await browser.newWindow("http://localhost:3005/dc-filters.html");
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
      newsletterPopupsBlockingFilterDisplayed: false
    };
    const actualFilterValues = Object.fromEntries(
      await Promise.all([
        [
          "pushNotificationsHidingFilterDisplayed",
          await testPages.isPushNotificationsHidingFilterIdDisplayed()
        ],
        [
          "pushNotificationsBlockingFilterDisplayed",
          await testPages.isPushNotificationsBlockingFilterIdDisplayed()
        ],
        [
          "autoplayVideosHidingFilterDisplayed",
          await testPages.isAutoplayVideosHidingFilterIdDisplayed()
        ],
        [
          "autoplayVideosBlockingFilterDisplayed",
          await testPages.isAutoplayVideosBlockingFilterIdDisplayed()
        ],
        [
          "surveysHidingFilterDisplayed",
          await testPages.isSurveysHidingFilterIdDisplayed()
        ],
        [
          "surveysBlockingFilterDisplayed",
          await testPages.isSurveysBlockingFilterIdDisplayed()
        ],
        [
          "newsletterPopupsHidingFilterDisplayed",
          await testPages.isNewsletterPopupsHidingFilterIdDisplayed()
        ],
        [
          "newsletterPopupsBlockingFilterDisplayed",
          await testPages.isNewsletterPopupsBlockingFilterIdDisplayed()
        ]
      ])
    );
    expect(actualFilterValues).to.deep.equal(expectedFilterValues);
  });
};
