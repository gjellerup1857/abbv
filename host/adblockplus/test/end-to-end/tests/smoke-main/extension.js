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
  switchToABPOptionsTab,
  waitForAssertion,
  reloadExtension,
  isEdge
} = require("../../helpers");
const { expect } = require("chai");
const AdvancedPage = require("../../page-objects/advanced.page");
const PopupPage = require("../../page-objects/popup.page");

module.exports = function () {
  let globalOrigin;
  let popupUrl;

  before(function () {
    ({ globalOrigin, popupUrl } = global);
  });

  it("displays total ad block count", async function () {
    const url =
      "https://eyeo.gitlab.io/browser-extensions-and-premium/supplemental/QA-team/adblocking/adblocked-count/adblocked-count-testpage.html";
    const popupPage = new PopupPage(browser);
    const maxAdsBlocked = 18;

    await browser.newWindow(url);
    await popupPage.init(popupUrl);
    const blockedFirst = await popupPage.waitForNumberOfAdsBlockedToBeInRange(
      0,
      maxAdsBlocked
    );
    await browser.closeWindow();

    await browser.switchWindow(url);
    await browser.refresh();
    await popupPage.init(popupUrl);
    await popupPage.waitForNumberOfAdsBlockedToBeInRange(
      blockedFirst,
      maxAdsBlocked
    );
    await browser.closeWindow();

    await browser.switchWindow(url);
    await browser.closeWindow();
  });

  it("resets settings", async function () {
    // https://eyeo.atlassian.net/browse/EXT-153
    if (isEdge()) this.skip();

    await switchToABPOptionsTab();

    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAbpFiltersFLTrashButton();
    await advancedPage.clickEasyListFLTrashButton();
    await advancedPage.clickAllowNonintrusiveAdvertisingFLTrashButton();
    await advancedPage.init();
    expect(await advancedPage.getFlTableEmptyPlaceholderText()).to.equal(
      "You have not added any filter lists to Adblock Plus. Filter lists " +
        "you add will be shown here."
    );

    // reload the extension after resetting the settings
    await reloadExtension();

    // check the settings
    await waitForAssertion(
      async () => {
        await switchToABPOptionsTab({ refresh: true });
        await advancedPage.init();
        expect(await advancedPage.isAbpFiltersFLDisplayed()).to.be.true;
      },
      {
        timeout: 30000,
        timeoutMsg: "ABP filters FL is not displayed",
        interval: 2000
      }
    );
    expect(await advancedPage.isEasyListFLDisplayed()).to.be.true;
    expect(await advancedPage.isAllowNonintrusiveAdvertisingFLDisplayed()).to.be
      .true;
    const popupPage = new PopupPage(browser);
    await popupPage.init(popupUrl);
    await waitForAssertion(
      async () => {
        expect(
          String(await popupPage.getNotificationMessageText()).includes(
            "An issue has caused your ABP settings to be reset to default. Fix " +
              "the issue and learn more"
          )
        ).to.be.true;
      },
      {
        timeout: 30000,
        timeoutMsg: "Popup page didn't show reset settings message",
        interval: 2000
      }
    );
    await popupPage.clickLinkInNotificationMessage();
    await popupPage.switchToProblemPageTab();
    expect(
      String(await popupPage.getCurrentUrl()).includes(
        `${globalOrigin}/problem.html`
      )
    ).to.be.true;
  });
};
