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
import webdriver from "selenium-webdriver";

import {
  getDisplayedElement,
  isCheckboxEnabled,
  openNewTab,
  waitForNotDisplayed,
  waitAndClickOnElement,
} from "../utils/driver.js";
import {
  addFiltersToAdBlock,
  blockHideUrl,
  initOptionsGeneralTab,
  initOptionsFiltersTab,
  checkSubscribedInfo,
  setPausedStateFromPopup,
  initOptionsCustomizeTab,
  getTotalCountFromPopup,
  getSubscriptionInfo,
  setCustomFilters,
  enableTemporaryPremium,
  initOptionsPremiumFlTab,
  getCustomFilters,
} from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";
import { upgradeExtension } from "../runners/helpers.js";
import {
  getDefaultFilterLists,
  premiumFilterLists,
  languageFilterLists,
} from "../utils/dataset.js";

const { By } = webdriver;

async function blockSomeItems() {
  // This filter no longer exists in easylist
  // To be removed by https://eyeo.atlassian.net/browse/EXT-282
  await addFiltersToAdBlock("/pop_ads.js");
  await openNewTab(blockHideUrl);
  await driver.sleep(3000); // wait for blocked requests to be counted

  // cleanup
  await driver.close();
  await driver.switchTo().window(getOptionsHandle());
}

export default () => {
  it("keeps settings after upgrade", async function () {
    await blockSomeItems();
    const totalCount = await getTotalCountFromPopup();
    expect(totalCount).toBeGreaterThan(0);

    // activate premium
    await enableTemporaryPremium();

    // enable premium filterlists
    await initOptionsPremiumFlTab(getOptionsHandle());
    for (const list of premiumFilterLists) {
      await waitAndClickOnElement(`span:has(> #${list.inputId})`);
      await driver.wait(isCheckboxEnabled(list.inputId), 2000, `${list.text} is not enabled`);
    }

    // turn off the counter on the extension icon
    await initOptionsGeneralTab(getOptionsHandle());
    await waitAndClickOnElement("span:has(> #prefs__show_statsinicon)");
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
      await waitAndClickOnElement(`span:has(> #${list.inputId})`);
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
        await checkSubscribedInfo(list.name, list.inputId);
      }
    }

    // note: we need easylist to be off, otherwise there is no enough space for all the filters (MV3)
    // subscribe to German + English filterlist
    const langList = languageFilterLists.find((list) => list.name === "easylist_plus_german");
    await getDisplayedElement("#language_select");
    await driver.findElement(By.css(`#language_select > option[value="${langList.name}"]`)).click();
    await driver.wait(isCheckboxEnabled(langList.inputId), 2000, `${langList.text} is not enabled`);
    await checkSubscribedInfo(langList.name, langList.inputId);

    // allowlist the page
    await setPausedStateFromPopup("https://example.com/", true);

    // Add custom filter
    await initOptionsCustomizeTab(getOptionsHandle());
    await setCustomFilters(["/testfiles/blocking/partial-path/"], true);

    // upgrade extension
    await upgradeExtension();

    // check total count
    expect(await getTotalCountFromPopup()).toEqual(totalCount);

    // check if total count is still increasing
    await blockSomeItems();
    expect(await getTotalCountFromPopup()).toBeGreaterThan(totalCount);

    // check if premium filterlists are still enabled and can be changed
    await initOptionsPremiumFlTab(getOptionsHandle());
    for (const list of premiumFilterLists) {
      await waitAndClickOnElement(`span:has(> #${list.inputId})`);
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
    await waitAndClickOnElement("span:has(> #prefs__show_statsinicon)");
    await driver.wait(
      isCheckboxEnabled("prefs__show_statsinicon"),
      2000,
      "Counter on the extension icon is still off",
    );

    // check if German + English filterlist is still subscribed
    await initOptionsFiltersTab(getOptionsHandle());
    await waitAndClickOnElement(`span:has(> #${langList.inputId})`);
    await waitForNotDisplayed(`span:has(> #${langList.inputId})`);

    // acceptable ads (on), easylist (on), easyprivacy (off)
    for (const list of lists) {
      await waitAndClickOnElement(`span:has(> #${list.inputId})`);
      if (list.enabled) {
        // if list is enabled by default, it should be subscribed
        await checkSubscribedInfo(list.name, list.inputId);
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
    await setPausedStateFromPopup("https://example.com/", false);

    // check if custom filters are still there and can be changed
    await initOptionsCustomizeTab(getOptionsHandle());
    expect(await getCustomFilters()).toContain("/testfiles/blocking/partial-path/");
    await setCustomFilters([]);
    expect(await getCustomFilters()).not.toContain("/testfiles/blocking/partial-path/");
  });
};
