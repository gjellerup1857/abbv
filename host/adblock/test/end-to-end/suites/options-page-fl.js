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

import { waitForNotNullAttribute, getDisplayedElement, findUrl } from "../utils/driver.js";
import {
  initOptionsGeneralTab,
  initOptionsFiltersTab,
  getSubscriptionInfo,
  clickFilterlist,
} from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";
import { getDefaultFilterLists, languageFilterLists } from "../utils/dataset.js";

const { By } = webdriver;

export default () => {
  it("displays the default state", async function () {
    const { driver, browserName } = this;
    const filterLists = getDefaultFilterLists(browserName);

    await initOptionsFiltersTab(driver, getOptionsHandle());

    for (const { name, inputId, text, enabled } of filterLists) {
      const flEnabled = await waitForNotNullAttribute(driver, inputId, "checked");
      const selector =
        name === "acceptable_ads_privacy"
          ? `[name="${name}"] > label`
          : `[name="${name}"] > label h1`;
      const flElem = await getDisplayedElement(driver, selector);
      const flText = await flElem.getText();

      expect({ name, text: flText, enabled: flEnabled }).toEqual({ name, text, enabled });
    }
  });

  it("shows the built in language filter list dropdown", async function () {
    const { driver } = this;

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const dropdown = await getDisplayedElement(driver, "#language_select");

    const actualLanguageLists = [];
    for (const option of await dropdown.findElements(By.css("option"))) {
      const id = await option.getAttribute("value");
      if (!id) {
        continue;
      }

      const text = await option.getText();
      actualLanguageLists.push({ id, text });
    }

    expect(actualLanguageLists).toEqual(languageFilterLists);
  });

  it("updates all filter lists", async function () {
    const { driver, browserName } = this;
    const filterLists = getDefaultFilterLists(browserName).filter(({ enabled }) => enabled);

    const checkSubscriptionsInfo = async (updatedWhen, timeout) => {
      await driver.wait(
        async () => {
          try {
            for (const { name } of filterLists) {
              const text = await getSubscriptionInfo(driver, name);
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

    await initOptionsFiltersTab(driver, getOptionsHandle());
    await checkSubscriptionsInfo("ago", 20000);

    const updateNow = await getDisplayedElement(driver, "#btnUpdateNow");
    await updateNow.click();
    await checkSubscriptionsInfo("right now", 10000);

    await checkSubscriptionsInfo("seconds ago", 20000);
  });

  it("goes to a filter list source page", async function () {
    const { driver, manifestVersion } = this;
    const aaUrl =
      manifestVersion === 2
        ? "https://easylist-downloads.adblockplus.org/exceptionrules.txt"
        : "https://easylist-downloads.adblockplus.org/v3/full/exceptionrules.txt";

    const enableAdvancedUser = async () => {
      let advancedUserEnabled = await waitForNotNullAttribute(
        driver,
        "enable_show_advanced_options",
        "checked",
      );
      if (!advancedUserEnabled) {
        const advancedUser = await getDisplayedElement(
          driver,
          "span:has(> #enable_show_advanced_options)",
        );
        await advancedUser.click();
        // after clicking on advancedUser the page seems to reload itself
        await driver.sleep(1000);
        await driver.wait(
          async () => {
            advancedUserEnabled = await waitForNotNullAttribute(
              driver,
              "enable_show_advanced_options",
              "checked",
            );
            return advancedUserEnabled;
          },
          1000,
          "The advanced user was not enabled after clicking",
        );
      }
    };

    await initOptionsGeneralTab(driver, getOptionsHandle());
    await enableAdvancedUser();

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const showLinks = await getDisplayedElement(driver, "#btnShowLinks");
    await showLinks.click();

    const aaLink = await getDisplayedElement(
      driver,
      '[name="acceptable_ads"] > label a.filter-list-link',
    );
    await aaLink.click();

    await findUrl(driver, aaUrl);
  });

  it("disables and reenables a filter list", async function () {
    const { driver } = this;
    const flName = "anticircumvent";
    const flId = "adblockFilterList_2";

    await initOptionsFiltersTab(driver, getOptionsHandle());
    let flEnabled = await waitForNotNullAttribute(driver, flId, "checked");
    expect(flEnabled).toEqual(true);

    await clickFilterlist(driver, flName);
    flEnabled = await waitForNotNullAttribute(driver, flId, "checked");
    expect(flEnabled).toEqual(false);
    let text = await getSubscriptionInfo(driver, flName);
    expect(text).toEqual("Unsubscribed.");

    // Clicking right after unsubscribed may be ineffective
    await driver.sleep(500);
    await clickFilterlist(driver, flName);
    flEnabled = await waitForNotNullAttribute(driver, flId, "checked");
    expect(flEnabled).toEqual(true);
    await driver.wait(
      async () => {
        text = await getSubscriptionInfo(driver, flName);
        return text === "updated right now";
      },
      1000,
      `${flName} info was not updated when reenabling it`,
    );
  });
};
