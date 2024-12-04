/* eslint-disable no-await-in-loop */
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

import { expect } from "expect";
import { By } from "selenium-webdriver";

import {
  getDisplayedElement,
  isCheckboxEnabled,
  openNewTab,
  waitForNotDisplayed,
  clickOnDisplayedElement,
} from "../utils/driver.js";
import {
  addFiltersToAdBlock,
  blockHideUrl,
  initOptionsGeneralTab,
  initOptionsFiltersTab,
  waitForSubscribed,
  setPausedStateFromPopup,
  initOptionsCustomizeTab,
  getPopupBlockedAdsTotalCount,
  getSubscriptionInfo,
  setCustomFilters,
  enableTemporaryPremium,
  initOptionsPremiumFlTab,
  getCustomFilters,
  waitForAdsBlockedToBeInRange,
  aaTestPageUrl,
} from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";
import { upgradeExtension } from "../runners/helpers.js";
import {
  getDefaultFilterLists,
  premiumFilterLists,
  languageFilterLists,
} from "../utils/dataset.js";

async function blockAds() {
  await openNewTab(blockHideUrl);
  await driver.switchTo().window(getOptionsHandle());
}

export default () => {
  beforeEach(async function () {
    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToAdBlock("/pop_ads.js");
  });

  it("keeps settings after upgrade", async function () {
    this.timeout(100000); // Long test with many checks, including the extension reload

    const customFilter = "/testfiles/blocking/partial-path/";
    const maxAdsBlocked = 15;

    // activate premium
    await enableTemporaryPremium();

    // enable premium filterlists
    await initOptionsPremiumFlTab(getOptionsHandle());
    for (const list of premiumFilterLists) {
      await clickOnDisplayedElement(`span:has(> #${list.inputId})`);
      await driver.wait(isCheckboxEnabled(list.inputId), 2000, `${list.text} is not enabled`);
    }

    // turn off the counter on the extension icon
    await initOptionsGeneralTab(getOptionsHandle());
    await clickOnDisplayedElement("span:has(> #prefs__show_statsinicon)");
    await driver.wait(
      async () => {
        return !(await isCheckboxEnabled("prefs__show_statsinicon"));
      },
      2000,
      "Counter on the extension icon is still on",
    );

    // acceptable ads (off), easyList (off), easyprivacy (on)
    await initOptionsFiltersTab(getOptionsHandle());
    const lists = getDefaultFilterLists().filter((list) =>
      ["easyprivacy", "acceptable_ads", "easylist"].includes(list.name),
    );
    for (const list of lists) {
      await clickOnDisplayedElement(`span:has(> #${list.inputId})`);
      if (list.enabled) {
        // if list is enabled by default, it should be unsubscribed
        await driver.wait(
          async () => {
            return (await getSubscriptionInfo(list.name)) === "Unsubscribed.";
          },
          2000,
          `${list.text} is still subscribed`,
        );
      } else {
        // if list is disabled by default, it should be subscribed
        await waitForSubscribed(list.name, list.inputId);
      }
    }

    // note: we need easylist to be off, otherwise there is no enough space for all the filters (MV3)
    // subscribe to German + English filterlist
    const langList = languageFilterLists.find((list) => list.name === "easylist_plus_german");
    await getDisplayedElement("#language_select");
    await driver.findElement(By.css(`#language_select > option[value="${langList.name}"]`)).click();
    await driver.wait(isCheckboxEnabled(langList.inputId), 2000, `${langList.text} is not enabled`);
    await waitForSubscribed(langList.name, langList.inputId);

    // allowlist the page
    // The URL used here cannot be localTestPageUrl because it interferes with
    // getPopupBlockedAdsTotalCount, which uses it
    await setPausedStateFromPopup(aaTestPageUrl, true);

    // Add custom filter
    await initOptionsCustomizeTab(getOptionsHandle());
    await setCustomFilters([customFilter], true);

    await blockAds();
    const blockedBeforeUpgrade = await waitForAdsBlockedToBeInRange(0, maxAdsBlocked);

    // upgrade extension
    const prevExtVersion = extension.version;
    await upgradeExtension();

    // check the extension version has changed
    expect(extension.version).not.toEqual(prevExtVersion);

    // check blocked ads count is kept after upgrade
    expect(await getPopupBlockedAdsTotalCount()).toEqual(blockedBeforeUpgrade);

    // check if blocked ads are still increasing
    await blockAds();
    await waitForAdsBlockedToBeInRange(blockedBeforeUpgrade, maxAdsBlocked);

    // check if premium filterlists are still enabled and can be changed
    await initOptionsPremiumFlTab(getOptionsHandle());
    for (const list of premiumFilterLists) {
      await clickOnDisplayedElement(`span:has(> #${list.inputId})`);
      await driver.wait(
        async () => {
          return !(await isCheckboxEnabled(list.inputId));
        },
        2000,
        `${list.text} is still enabled`,
      );
    }

    // check if the counter on the extension icon is still off
    await initOptionsGeneralTab(getOptionsHandle());
    await clickOnDisplayedElement("span:has(> #prefs__show_statsinicon)");
    await driver.wait(
      isCheckboxEnabled("prefs__show_statsinicon"),
      2000,
      "Counter on the extension icon is still off",
    );

    // check if German + English filterlist is still subscribed
    await initOptionsFiltersTab(getOptionsHandle());
    await clickOnDisplayedElement(`span:has(> #${langList.inputId})`);
    await waitForNotDisplayed(`span:has(> #${langList.inputId})`);

    // acceptable ads (on), easylist (on), easyprivacy (off)
    for (const list of lists) {
      await clickOnDisplayedElement(`span:has(> #${list.inputId})`);
      if (list.enabled) {
        // if list is enabled by default, it should be subscribed
        await waitForSubscribed(list.name, list.inputId);
      } else {
        // if list is disabled by default, it should be unsubscribed
        await driver.wait(
          async () => {
            return (await getSubscriptionInfo(list.name)) === "Unsubscribed.";
          },
          2000,
          `${list.text} is still subscribed`,
        );
      }

      // checkbox should equal to the default value
      expect(await isCheckboxEnabled(list.inputId)).toEqual(list.enabled);
    }

    // check if the page is still allowlisted and can be changed
    await setPausedStateFromPopup(aaTestPageUrl, false);

    // check if custom filters are still there and can be changed
    await initOptionsCustomizeTab(getOptionsHandle());
    let customFilters;
    await driver.wait(
      async () => {
        customFilters = await getCustomFilters();
        return customFilters[0] !== "";
      },
      5000,
      "Custom filters were empty",
    );
    expect(customFilters).toContain(customFilter);

    // check if custom filters can be changed
    await setCustomFilters([]);
    expect(await getCustomFilters()).not.toContain(customFilter);
  });
};
