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
  isCheckboxEnabled,
  getDisplayedElement,
  findUrl,
  waitForNotDisplayed,
} from "../../utils/driver.js";
import {
  initOptionsGeneralTab,
  initOptionsFiltersTab,
  getSubscriptionInfo,
  clickFilterlist,
  checkSubscribedInfo,
} from "../../utils/page.js";
import { getOptionsHandle } from "../../utils/hook.js";
import { getDefaultFilterLists, languageFilterLists } from "../../utils/dataset.js";

const { By } = webdriver;

async function setFilterListUrl(url) {
  const customFLElem = await getDisplayedElement("#txtNewSubscriptionUrl");
  await customFLElem.click();
  await customFLElem.sendKeys(url);
  await driver.findElement(By.id("btnNewSubscriptionUrl")).click();
}

export default () => {
  beforeEach(async function () {
    await initOptionsFiltersTab(getOptionsHandle());
  });

  it("displays the default state", async function () {
    const defaultFilterLists = getDefaultFilterLists();

    for (const { name, inputId, text, enabled } of defaultFilterLists) {
      const flEnabled = await isCheckboxEnabled(inputId);
      const selector =
        name === "acceptable_ads_privacy"
          ? `[name="${name}"] > label`
          : `[name="${name}"] > label h1`;
      const flElem = await getDisplayedElement(selector);
      const flText = await flElem.getText();

      expect({ name, text: flText, enabled: flEnabled }).toEqual({ name, text, enabled });
    }
  });

  it("shows the built in language filter list dropdown", async function () {
    const dropdown = await getDisplayedElement("#language_select");
    const actualLanguageLists = [];
    for (const option of await dropdown.findElements(By.css("option"))) {
      const name = await option.getAttribute("value");
      if (!name) {
        continue;
      }

      const text = await option.getText();
      actualLanguageLists.push({ name, text });
    }

    expect(actualLanguageLists).toEqual(
      languageFilterLists.map(({ name, text }) => ({ name, text })),
    );
  });

  it("updates all filter lists", async function () {
    const defaultFilterLists = getDefaultFilterLists().filter(({ enabled }) => enabled);

    const checkDefaultSubscriptionsInfo = async (updatedWhen, timeout) => {
      await driver.wait(
        async () => {
          try {
            for (const { name } of defaultFilterLists) {
              const text = await getSubscriptionInfo(name);
              expect(text).toMatch(new RegExp(`updated.*${updatedWhen}`));
            }
            return true;
          } catch (e) {}
        },
        timeout,
        `Filter lists were not updated "${updatedWhen}" after ${timeout}ms`,
        500,
      );
    };

    await checkDefaultSubscriptionsInfo("ago", 20000);

    const updateNow = await getDisplayedElement("#btnUpdateNow");
    await updateNow.click();
    await checkDefaultSubscriptionsInfo("right now", 10000);

    await checkDefaultSubscriptionsInfo("seconds ago", 20000);
  });

  it("goes to a filter list source page", async function () {
    const aaUrl =
      extension.manifestVersion === 2
        ? "https://easylist-downloads.adblockplus.org/exceptionrules.txt"
        : "https://easylist-downloads.adblockplus.org/v3/full/exceptionrules.txt";

    const enableAdvancedUser = async () => {
      let advancedUserEnabled = await isCheckboxEnabled("enable_show_advanced_options");
      if (!advancedUserEnabled) {
        const advancedUser = await getDisplayedElement("span:has(> #enable_show_advanced_options)");
        await advancedUser.click();
        // after clicking on advancedUser the page seems to reload itself
        await driver.sleep(1000);
        await driver.wait(
          async () => {
            advancedUserEnabled = await isCheckboxEnabled("enable_show_advanced_options");
            return advancedUserEnabled;
          },
          1000,
          "The advanced user was not enabled after clicking",
        );
      }
    };

    await initOptionsGeneralTab(getOptionsHandle());
    await enableAdvancedUser();

    await initOptionsFiltersTab(getOptionsHandle());
    const showLinks = await getDisplayedElement("#btnShowLinks");
    await showLinks.click();

    const aaLink = await getDisplayedElement('[name="acceptable_ads"] > label a.filter-list-link');
    await aaLink.click();

    await findUrl(aaUrl);
  });

  for (const name of ["anticircumvent", "easylist"]) {
    it(`disables and reenables the ${name} filter list`, async function () {
      const { inputId } = getDefaultFilterLists().find((fl) => fl.name === name);

      const flEnabled = await isCheckboxEnabled(inputId);
      expect(flEnabled).toEqual(true);

      await clickFilterlist(name, inputId, false);
      const text = await getSubscriptionInfo(name);
      expect(text).toEqual("Unsubscribed.");

      if (name === "easylist") {
        const mainInfo = await getDisplayedElement("#easylist_info > b");
        expect(await mainInfo.getText()).toEqual(
          "AdBlock uses EasyList to block ads on most websites.",
        );
        const otherInfo = await getDisplayedElement("#easylist_info > span");
        expect(await otherInfo.getText()).toEqual(
          'We recommend keeping it on. If you unsubscribed by accident, please select "EasyList" now to block more ads.',
        );
      }

      // Clicking right after unsubscribed may be ineffective
      await driver.sleep(1000);
      await clickFilterlist(name, inputId, true);
      await checkSubscribedInfo(name, inputId);
    });
  }

  it("adds and removes a language filter list", async function () {
    const name = "easylist_plus_vietnamese";
    const inputId = "languageFilterList_24";

    await getDisplayedElement("#language_select");
    await driver.findElement(By.css(`#language_select > option[value="${name}"]`)).click();
    await checkSubscribedInfo(name, inputId);

    // Clicking right after subscribed may be ineffective
    await driver.sleep(1000);
    await clickFilterlist(name);
    await waitForNotDisplayed(`[name="${name}"]`);
  });

  it("adds and removes a filter list via URL", async function () {
    const subscriptionUrl = "https://abptestpages.org/en/abp-testcase-subscription.txt";
    const name = `url:${subscriptionUrl}`;
    const inputId = "customFilterList_1";

    await setFilterListUrl(subscriptionUrl);
    await checkSubscribedInfo(name, inputId);

    await clickFilterlist(name, inputId, false);
    await driver.findElement(By.css(`[name="${name}"] a.remove_filterList`)).click();
    await waitForNotDisplayed(`[name="${name}"]`);
  });

  it("displays an error for invalid filter list via URL", async function () {
    const invalidSubscriptionUrl = "invalid.txt";
    const name = `url:${invalidSubscriptionUrl}`;

    await setFilterListUrl(invalidSubscriptionUrl);

    const alert = await driver.switchTo().alert();
    expect(await alert.getText()).toEqual("Failed to fetch this filter!");
    await alert.accept();
    await waitForNotDisplayed(`[name="${name}"]`);
  });
};
