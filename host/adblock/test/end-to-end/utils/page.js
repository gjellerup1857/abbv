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

import webdriver from "selenium-webdriver";

import {
  getDisplayedElement,
  openNewTab,
  findUrl,
  waitForNotNullAttribute,
  isCheckboxEnabled,
  waitForNotDisplayed,
  clickAndCloseNewTab,
} from "./driver.js";
import { expect } from "expect";

const { By, Key } = webdriver;

export const installUrl = "getadblock.com/en/installed";
export const blockHideUrl =
  "https://adblockinc.gitlab.io/QA-team/adblocking/blocking-hiding/blocking-hiding-testpage.html";

export async function initPopupPage(driver, origin, tabId) {
  const tabIdParam = tabId ? `?tabId=${tabId}` : "";
  const url = `${origin}/adblock-button-popup.html${tabIdParam}`;
  await openNewTab(driver, url);
  await getDisplayedElement(driver, ".header-logo", 5000);
}

async function loadOptionsTab(driver, optionsHandle, id) {
  await driver.switchTo().window(optionsHandle);

  let tabLink;
  try {
    tabLink = await driver.findElement(By.css(`[href="#${id}"]`));
  } catch (err) {
    if (err.name !== "StaleElementReferenceError") {
      throw err;
    }
    // The options page has stale elements, reloading as a workaround
    await driver.navigate().refresh();
    // https://eyeo.atlassian.net/browse/EXT-335
    await driver.sleep(500);
    tabLink = await driver.findElement(By.css(`[href="#${id}"]`));
  }

  await tabLink.click();
  await driver.wait(
    async () => {
      return (await driver.getCurrentUrl()).endsWith(`#${id}`);
    },
    1000,
    `Clicking on "${id}" options tab didn't load the tab url`,
  );
}

export async function initOptionsFiltersTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "filters");
  // Wait until a filterlist is displayed
  await getDisplayedElement(driver, '[name="easylist"]', 8000);
}

export async function initOptionsCustomizeTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "customize");
}

export async function initOptionsGeneralTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "general");
  await waitForNotNullAttribute(driver, "acceptable_ads", "checked");
  // https://eyeo.atlassian.net/browse/EXT-335
  await driver.sleep(1000);
}

export async function initOptionsPremiumTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "mab");
  // https://eyeo.atlassian.net/browse/EXT-335
  await driver.sleep(3000);
  await driver.navigate().refresh();
}

export async function initOptionsThemesTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "mab-themes");
}

export async function initOptionsImageSwapTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "mab-image-swap");
}

export async function initOptionsBackupSyncTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "sync");
}

export async function initOptionsPremiumFilersTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "premium-filters");
}

export async function setCustomFilters(driver, filters) {
  const editButton = await getDisplayedElement(driver, "#btnEditAdvancedFilters", 2000);

  // The edit button functionality may take some time to be ready.
  // Retrying as a workaround
  let saveButton;
  await driver.wait(async () => {
    try {
      await editButton.click();
      saveButton = await getDisplayedElement(driver, "#btnSaveAdvancedFilters", 500, false);
      return true;
    } catch (e) {}
  });

  const filtersAdvancedElem = await getDisplayedElement(driver, "#txtFiltersAdvanced");
  await filtersAdvancedElem.clear();
  for (const filter of filters) {
    await filtersAdvancedElem.sendKeys(filter);
    await filtersAdvancedElem.sendKeys(Key.RETURN);
  }
  await saveButton.click();
}

export async function getUserIdFromPage(driver) {
  await findUrl(driver, installUrl);

  let userId;
  await driver.wait(async () => {
    try {
      userId = await driver.executeScript(() => {
        return document.getElementById("adblockUserId").textContent;
      });
      return true;
    } catch (err) {}
  });

  return userId;
}

export async function getUserIdFromStorage(driver, optionsHandle) {
  const currentHandle = await driver.getWindowHandle();

  await driver.switchTo().window(optionsHandle);
  const userId = await driver.executeAsyncScript(async (callback) => {
    const res = await browser.storage.local.get("userid");
    callback(res.userid);
  });

  await driver.switchTo().window(currentHandle);
  return userId;
}

export async function getSubscriptionInfo(driver, name) {
  let text;
  await driver.wait(async () => {
    const info = await driver.findElement(By.css(`[name="${name}"] .subscription_info`));
    text = await info.getText();
    return text !== "";
  });

  return text;
}

// This function assumes initOptionsFiltersTab() being called beforehand
export async function clickFilterlist(driver, name, id, enabledAfterClick) {
  await driver.findElement(By.css(`[name="${name}"]`)).click();

  // Language filter lists get removed from the UI after disabling them.
  // In that case no further checks are done here
  if (!id) {
    return;
  }

  const text = enabledAfterClick ? "enabled" : "disabled";
  await driver.wait(
    async () => {
      return (await isCheckboxEnabled(driver, id)) === enabledAfterClick;
    },
    1000,
    `The filterlist "${name}" was not ${text} after clicking`,
  );
}

/**
 * Add filters to AdBlock
 *
 * @param {object} driver - The driver object
 * @param {string} filters - The filter rules to add
 * @returns {Promise<void>}
 */
export async function addFiltersToAdBlock(driver, filters) {
  const err = await driver.executeAsyncScript(async (filtersToAdd, callback) => {
    const errors = await browser.runtime.sendMessage({
      type: "filters.importRaw",
      text: filtersToAdd,
    });
    if (typeof errors !== "undefined" && errors[0]) {
      callback(errors[0]);
    }

    callback();
  }, filters);

  if (err) {
    throw new Error(err);
  }
}

/**
 * Checked that the elements from the blockHideUrl are allowlisted or not.
 *
 * @param {object} driver - The driver object
 * @param {boolean} [expectAllowlisted=false] - Whether the page is allowlisted
 * @returns {Promise<void>}
 */
export async function checkBlockHidePage(driver, { expectAllowlisted = false }) {
  let expectedPopadsText = "pop_ads.js was blocked";
  let expectedBanneradsText = "bannerads/* was blocked";

  if (expectAllowlisted) {
    expectedPopadsText = "pop_ads.js blocking filter should block this";
    expectedBanneradsText = "first bannerads/* blocking filter should block this";
  }

  await driver.wait(
    async () => {
      const popadsElem = await getDisplayedElement(driver, "#popads-blocking-filter");
      const banneradsElem = await getDisplayedElement(driver, "#bannerads-blocking-filter");

      try {
        expect(await popadsElem.getText()).toEqual(expectedPopadsText);
        expect(await banneradsElem.getText()).toEqual(expectedBanneradsText);
        return true;
      } catch (e) {
        await driver.navigate().refresh();
      }
    },
    5000,
    `filters were not applied on page when expectAllowlisted=${expectAllowlisted}`,
  );

  if (expectAllowlisted) {
    await getDisplayedElement(driver, "#search-ad", 2000);
    await getDisplayedElement(driver, "#AdContainer", 2000);
  } else {
    await waitForNotDisplayed(driver, "#search-ad", 2000);
    await waitForNotDisplayed(driver, "#AdContainer", 2000);
  }
}

export async function checkPremiumPageHeader(driver, ctaTextSelector, ctaLinkSelector, premiumURL) {
  const ctaText = await getDisplayedElement(driver, ctaTextSelector, 2000, false);
  expect(await ctaText.getText()).toEqual(
    "You’ll be an ad blocking pro with these easy-to-use add-ons.",
  );

  const ctaLink = await getDisplayedElement(driver, ctaLinkSelector);
  expect(await ctaLink.getText()).toEqual("Get It Now");

  await clickAndCloseNewTab(driver, ctaLinkSelector, premiumURL);
}
