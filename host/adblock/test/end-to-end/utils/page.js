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

import { expect } from "expect";
import {
  getDisplayedElement,
  openNewTab,
  findUrl,
  waitForNotNullAttribute,
  isCheckboxEnabled,
  waitForNotDisplayed,
  clickAndCloseNewTab,
  getTabId,
} from "./driver.js";
import { getOptionsHandle, setOptionsHandle } from "./hook.js";

const { By, Key } = webdriver;

export const installUrl = "getadblock.com/en/installed";
export const blockHideUrl =
  "https://adblockinc.gitlab.io/QA-team/adblocking/blocking-hiding/blocking-hiding-testpage.html";

export async function initPopupPage(driver, popupUrl, tabId) {
  const tabIdParam = tabId ? `?tabId=${tabId}` : "";
  const url = `${popupUrl}${tabIdParam}`;
  const handle = await openNewTab(driver, url);
  await getDisplayedElement(driver, ".header-logo", 5000);
  return handle;
}

async function loadOptionsTab(driver, optionsHandle, id) {
  await driver.switchTo().window(optionsHandle);

  await driver.wait(
    async () => {
      try {
        const tabLink = await driver.findElement(By.css(`[href="#${id}"]`));
        await tabLink.click();
        return true;
      } catch (err) {
        if (err.name !== "NoSuchElementError" && err.name !== "StaleElementReferenceError") {
          throw err;
        }
        // The options page has stale elements, reloading as a workaround
        await driver.navigate().refresh();
        // https://eyeo.atlassian.net/browse/EXT-335
        await driver.sleep(1000);
      }
      return false;
    },
    5000,
    `Couldn't click on "${id}" options tab`,
  );

  // Make sure the URL is updated
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
  await driver.sleep(2500);
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

export async function initOptionsPremiumFlTab(driver, optionsHandle) {
  await loadOptionsTab(driver, optionsHandle, "premium-filters");
  await getDisplayedElement(driver, "#premium-filter-lists > div:nth-child(2)", 2000);
}

export async function getCustomFilters() {
  const { driver } = global;

  const filtersAdvancedElem = await getDisplayedElement(driver, "#txtFiltersAdvanced");
  // filters are loaded with a delay
  await driver.sleep(2000);
  const filters = await filtersAdvancedElem.getAttribute("value");
  return filters.split("\n");
}

export async function setCustomFilters(filters, append = false) {
  const { driver } = global;
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
  if (!append) {
    await filtersAdvancedElem.clear();
  }

  for (const filter of filters) {
    await filtersAdvancedElem.sendKeys(Key.RETURN);
    await filtersAdvancedElem.sendKeys(filter);
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

/**
 * Reload the extension and wait for the options page to be displayed
 *
 * * @param {boolean} [suppressUpdatePage=true] - Whether to suppress
 *    the update page or not before reloading
 * @returns {Promise<void>}
 */
export async function reloadExtension(suppressUpdatePage = true) {
  const { driver, extOrigin } = global;

  // Extension pages will be closed during reload,
  // create a new tab to avoid the "target window already closed" error
  const safeHandle = await openNewTab(driver, "http://localhost:3005/test.html");

  // ensure options page is open
  await initOptionsGeneralTab(driver, getOptionsHandle());

  // Suppress page or not
  await updateSettings("suppress_update_page", suppressUpdatePage);

  // reload the extension
  await driver.executeScript(() => browser.runtime.reload());
  // Workaround for `target window already closed`
  await driver.switchTo().window(safeHandle);

  // Wait until the current option page is closed by the reload
  // otherwise the next step will fail
  await driver.wait(
    async () => {
      const handlers = await driver.getAllWindowHandles();
      return !handlers.includes(getOptionsHandle());
    },
    5000,
    "Current option page was not closed in time",
  );

  // The update page should be suppressed before reloading the extension
  // wait for the extension to be ready and the options page to be displayed
  await driver.wait(
    async () => {
      try {
        await driver.navigate().to(`${extOrigin}/options.html`);
        await waitForNotNullAttribute(driver, "acceptable_ads", "checked", 5000);
        return true;
      } catch (e) {
        await driver.navigate().refresh();
      }
    },
    20000,
    "Options page not found after reload",
    1000,
  );
  setOptionsHandle(await driver.getWindowHandle());
}

/**
 * Sends a message to the extension from the options page.
 *
 * @param {object} message The message to be sent to the extension
 */
export async function sendExtMessage(message) {
  const { driver } = global;
  const currentHandle = await driver.getWindowHandle();
  const optionsHandle = getOptionsHandle();
  if (currentHandle !== optionsHandle) {
    await initOptionsGeneralTab(driver, getOptionsHandle());
  }

  const extResponse = await driver.executeAsyncScript(async (params, callback) => {
    const result = await browser.runtime.sendMessage(params);
    callback(result);
  }, message);

  // go back to prev page
  await driver.switchTo().window(currentHandle);
  return extResponse;
}

/**
 * Removes a filter.
 * @param {string} filterText The filter text.
 */
export async function removeFilter(filterText) {
  return sendExtMessage({
    type: "filters.remove",
    text: filterText,
  });
}

/**
 * Adds a filter.
 * @param {string} filterText The filter text.
 */
export async function addFilter(filterText) {
  return sendExtMessage({
    type: "filters.add",
    text: filterText,
  });
}

/**
 * Changes a setting by sending a message to the extension on the settings page.
 *
 * @param {string} name The setting key name
 * @param {boolean} isEnabled The settings value
 */
export async function updateSettings(name, isEnabled) {
  return sendExtMessage({
    command: "setSetting",
    name,
    isEnabled,
  });
}

/**
 * Changes a pref by sending a message to the extension on the settings page.
 *
 * @param {string} key The pref key name
 * @param {*} value The pref value
 */
export async function updatePrefs(key, value) {
  return sendExtMessage({
    type: "prefs.set",
    key,
    value,
  });
}

export async function checkPremiumPageHeader(driver, ctaTextSelector, ctaLinkSelector, premiumURL) {
  // sometimes the elements are displayed with a delay
  const ctaText = await getDisplayedElement(driver, ctaTextSelector, 3000, false);
  expect(await ctaText.getText()).toEqual(
    "You’ll be an ad blocking pro with these easy-to-use add-ons.",
  );

  const ctaLink = await getDisplayedElement(driver, ctaLinkSelector);
  expect(await ctaLink.getText()).toEqual("Get It Now");

  await clickAndCloseNewTab(driver, ctaLinkSelector, premiumURL);
}

export async function setAADefaultState(driver, expectAAEnabled) {
  const name = "acceptable_ads";
  const inputId = "adblockFilterList_0";

  await initOptionsFiltersTab(driver, getOptionsHandle());
  const aaEnabled = await isCheckboxEnabled(driver, inputId);
  // Cleanup setting the AA default state
  if ((expectAAEnabled && !aaEnabled) || (!expectAAEnabled && aaEnabled)) {
    await clickFilterlist(driver, name, inputId, expectAAEnabled);
  }
}

export async function checkSubscribedInfo(driver, name, inputId, timeout = 3000) {
  const flEnabled = await isCheckboxEnabled(driver, inputId);
  expect(flEnabled).toEqual(true);
  await driver.wait(
    async () => {
      const text = await getSubscriptionInfo(driver, name);
      return text.includes("updated") || text === "Subscribed.";
    },
    timeout,
    `${name} info was not updated when adding it`,
  );
}

export async function setPausedStateFromPopup(url, paused = true) {
  const { driver, popupUrl } = global;
  const pauseBtnSelector = "[data-text='domain_pause_adblock']";
  const unpauseBtnSelector = "[data-text='unpause_adblock']";

  // open new tab with the URL that will be allowlisted
  const websiteHandle = await openNewTab(driver, url);

  // initialize the popup for the above page
  const tabId = await getTabId(driver, getOptionsHandle());
  await initPopupPage(driver, popupUrl, tabId);

  // click on the 'Pause' or 'Unpause' button
  const btn = await getDisplayedElement(
    driver,
    paused ? pauseBtnSelector : unpauseBtnSelector,
    5000,
  );
  await btn.click();

  await driver.switchTo().window(websiteHandle);
  await driver.navigate().refresh();

  // re-open the popup and check state changed
  await initPopupPage(driver, popupUrl, tabId);
  await getDisplayedElement(driver, paused ? unpauseBtnSelector : pauseBtnSelector, 5000);
  await driver.close();

  // switch to the page
  await driver.switchTo().window(websiteHandle);
  await driver.close();
  await driver.switchTo().window(getOptionsHandle());
}

export async function getTotalCountFromPopup() {
  const { driver, popupUrl } = global;
  const websiteHandle = await openNewTab(driver, "http://localhost:3005/test.html");
  const tabId = await getTabId(driver, getOptionsHandle());
  const popupHandle = await initPopupPage(driver, popupUrl, tabId);

  const elem = await getDisplayedElement(
    driver,
    "#popup_sections popup-detail-stats > div:nth-child(2) > span",
    2000,
    false,
  );

  const totalCount = await elem.getText();

  // cleanup
  await driver.switchTo().window(websiteHandle);
  await driver.close();
  await driver.switchTo().window(popupHandle);
  await driver.close();
  await driver.switchTo().window(getOptionsHandle());

  return parseInt(totalCount, 10);
}

export async function enableTemporaryPremium() {
  const { driver } = global;
  // activate premium
  await sendExtMessage({ type: "adblock:activate" });

  const currentDate = new Date();
  const options = { year: "numeric", month: "long" };
  const formattedDate = currentDate.toLocaleDateString("en-US", options).toUpperCase();
  const expectedValues = [`SUPPORTER SINCE ${formattedDate}`, "ACTIVE"];

  await initOptionsPremiumTab(driver, getOptionsHandle());
  const premiumStatus = await getDisplayedElement(driver, "#premium_status_msg", 4000, false);
  const premiumStatusText = await premiumStatus.getText();
  if (!expectedValues.includes(premiumStatusText)) {
    throw new Error(`Premium not activated.`);
  }
}
