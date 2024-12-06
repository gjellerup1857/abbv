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

import { switchToABPOptionsTab, waitForAssertion } from "../helpers.js";
import AdvancedPage from "../page-objects/advanced.page.js";
import GeneralPage from "../page-objects/general.page.js";

export default () => {
  it("should display default state", async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.isAbpFiltersFLDisplayed()).to.be.true;
    expect(await advancedPage.isAbpFiltersFLStatusToggleSelected()).to.be.true;
    expect(await advancedPage.isEasyListFLDisplayed()).to.be.true;
    expect(await advancedPage.isEasyListFLStatusToggleSelected()).to.be.true;
    expect(await advancedPage.isAllowNonintrusiveAdvertisingFLDisplayed()).to.be
      .true;
    expect(
      await advancedPage.isAllowNonintrusiveAdvertisingFLStatusToggleEnabled()
    ).to.be.false;
  });

  it("should go to filter list web page", async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLGearIcon();
    await advancedPage.clickEasyListFLWebsiteButton();
    await advancedPage.switchToEasylisttoTab();
    expect(await advancedPage.getCurrentUrl()).to.equal("https://easylist.to/");
  });

  it("should go to filter list source page", async function () {
    const easylistSourcePage =
      process.env.MANIFEST_VERSION === "3"
        ? "https://easylist-downloads.adblockplus.org/v3/full/easylist.txt"
        : "https://easylist-downloads.adblockplus.org/easylist.txt";
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLGearIcon();
    await advancedPage.clickEasyListFLSourceButton();
    await advancedPage.switchToEasylistSourceTab();
    expect(await advancedPage.getCurrentUrl()).to.equal(easylistSourcePage);
  });

  it("should disable/enable a filter list", async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLStatusToggle();
    expect(await advancedPage.isEasyListFLStatusToggleSelected()).to.be.false;
    await advancedPage.clickEasyListFLStatusToggle();
    expect(await advancedPage.isEasyListFLStatusToggleSelected()).to.be.true;
  });

  it("should delete a filter list", async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLTrashButton();
    await advancedPage.easyListFL.waitForDisplayed({ reverse: true });

    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    expect(await generalPage.getLanguagesTableEmptyPlaceholderText()).to.equal(
      "You don't have any language-specific filters."
    );
  });

  it("should add a built-in filter list", async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddBuiltinFilterListButton();
    expect(await advancedPage.isFilterListsDropdownDisplayed()).to.be.true;
    await advancedPage.clickListeFREasyListFL();

    expect(await advancedPage.isFilterListsDropdownDisplayed(true)).to.be.true;
    await waitForAssertion(
      async () => {
        expect(await advancedPage.isListeFREasyListFLDisplayed()).to.be.true;
      },
      { refresh: false, timeoutMsg: "isListeFREasyListFLDisplayed timed out" }
    );
    expect(await advancedPage.isListeFREasyListFLStatusToggleSelected()).to.be
      .true;

    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    await waitForAssertion(
      async () => {
        expect(
          await generalPage.isListeFRPlusEasylistLanguageTableItemDisplayed()
        ).to.be.true;
      },
      {
        refresh: false,
        timeoutMsg: "isListeFRPlusEasylistLanguageTableItemDisplayed timed out"
      }
    );
  });

  it("should add a filter list via URL", async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddNewFilterListButton();
    expect(await advancedPage.isAddNewFilterListDialogDisplayed()).to.be.true;

    await advancedPage.typeTextToFilterListUrlInput(
      "https://test-filterlist.txt"
    );
    await advancedPage.clickAddAFilterListButton();
    expect(await advancedPage.isAddNewFilterListDialogDisplayed(true)).to.be
      .true;
    expect(await advancedPage.isTestFilterListDisplayed()).to.be.true;
    expect(await advancedPage.isTestFilterListStatusToggleSelected()).to.be
      .true;
  });

  it("should display an error for invalid filter list via URL", async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddNewFilterListButton();
    expect(await advancedPage.isAddNewFilterListDialogDisplayed()).to.be.true;

    await advancedPage.typeTextToFilterListUrlInput("test-filterlist.txt");
    await advancedPage.clickAddAFilterListButton();
    expect(await advancedPage.isUrlErrorMessageDisplayed()).to.be.true;
    await advancedPage.clickCancelAddingFLButton();
    expect(await advancedPage.isTestFilterListNoHtttpsDisplayed()).to.be.false;
  });

  it("should display disabled filters error", async function () {
    const errorFilter = "expres.cz##.barMan";
    const advancedPage = new AdvancedPage(browser);

    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(errorFilter);
    await advancedPage.clickAddCustomFilterListButton();
    await browser.waitUntil(async () => {
      const firstItem = await advancedPage.customFilterListsNthItemText(1);
      return (await firstItem.getText()) === errorFilter;
    });
    await waitForAssertion(
      async () => {
        await advancedPage.clickCustomFilterListsFirstItemToggle();
        expect(await advancedPage.isAbpFiltersFLErrorIconDisplayed()).to.be
          .true;
      },
      { refresh: false }
    );

    await advancedPage.clickAbpFiltersFLErrorIcon();
    await waitForAssertion(
      async () => {
        expect(await advancedPage.getFilterListErrorTooltipText()).to.equal(
          "There are one or more issues with this filter list:" +
            "Some filters in this filter list are disabled.\nEnable them"
        );
      },
      { refresh: false }
    );

    await advancedPage.clickEnableThemButton();
    expect(await advancedPage.isFilterListErrorTooltipDisplayed(true)).to.be
      .true;
    expect(await advancedPage.isAbpTestFilterErrorIconDisplayed(true)).to.be
      .true;
    expect(await advancedPage.isCustomFilterListsFirstItemToggleSelected()).to
      .be.true;
  });

  it("should update all filter lists", async function () {
    const shortTimeout = 2000;
    const timeout = 61000;

    await switchToABPOptionsTab({ refresh: true });
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();

    await browser.waitUntil(
      async () => {
        await browser.refresh();
        await browser.switchToFrame(await $("#content"));
        await advancedPage.init();

        try {
          await advancedPage.waitForAbpFiltersFLLastUpdatedTextToEqual("minutes ago");
          return true;
        } catch (e) {
          return false;
        }
      },
      {
        timeout,
        timeoutMsg: `Last updated text was not 'minutes ago'`,
        interval: 7000
      }
    );

    // await browser.pause(61000);
    expect(
      await advancedPage.waitForAbpFiltersFLLastUpdatedTextToEqual("minutes ago")
    ).to.be.true;
    expect(
      await advancedPage.waitForEasyListFLLastUpdatedTextToEqual("minutes ago")
    ).to.be.true;
    expect(
      await advancedPage.waitForAllowNonintrusiveFLLastUpdatedTextToEqual(
        "minutes ago"
      )
    ).to.be.true;
    await advancedPage.clickUpdateAllFilterlistsButton();
    try {
      expect(
        await advancedPage.waitForAbpFiltersFLLastUpdatedTextToEqual("Just now")
      ).to.be.true;
      expect(
        await advancedPage.waitForEasyListFLLastUpdatedTextToEqual("Just now")
      ).to.be.true;
      expect(
        await advancedPage.waitForAllowNonintrusiveFLLastUpdatedTextToEqual(
          "Just now"
        )
      ).to.be.true;
    } catch (error) {
      // Filterlist status can be stuck on 'Updating' unless the page is reloaded, see opened issue: https://eyeo.atlassian.net/browse/EXT-402
      await switchToABPOptionsTab({ switchToFrame: true, refresh: true });
      await advancedPage.init();
      expect(
        await advancedPage.waitForAbpFiltersFLLastUpdatedTextToEqual("Just now")
      ).to.be.true;
      expect(
        await advancedPage.waitForEasyListFLLastUpdatedTextToEqual("Just now")
      ).to.be.true;
      expect(
        await advancedPage.waitForAllowNonintrusiveFLLastUpdatedTextToEqual(
          "Just now"
        )
      ).to.be.true;
    }
  });
};
