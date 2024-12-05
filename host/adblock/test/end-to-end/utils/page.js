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

import { By, Key } from "selenium-webdriver";
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
  clickOnDisplayedElement,
} from "./driver.js";
import { getOptionsHandle, setOptionsHandle } from "./hook.js";

export const installUrl = "https://getadblock.com/en/installed";
export const premiumUrl = "https://getadblock.com/en/premium";
export const blockHideUrl = "http://localhost:3005/blocking-hiding-testpage.html";
export const aaTestPageUrl = "http://testpages.adblockplus.org:3005/aa.html";
export const adBlockedCountUrl =
  "https://eyeo.gitlab.io/browser-extensions-and-premium/supplemental/QA-team/adblocking/adblocked-count/adblocked-count-testpage.html";
export const localTestPageUrl = "http://localhost:3005/test.html";
export const allowlistingFilter = "@@||localhost^$document";
export const customBlockingFilters = [
  "/pop_ads.js", // no longer exists in EasyList
  "localhost###search-ad", // Needed to override EasyList's "@@://localhost:$generichide"
  "localhost##.AdContainer", // Needed to override EasyList's "@@://localhost:$generichide"
];

const optionsPageSleep = 2000;

export async function initPopupPage(tabId) {
  const tabIdParam = tabId ? `?tabId=${tabId}` : "";
  const url = `${extension.popupUrl}${tabIdParam}`;
  const handle = await openNewTab(url);
  await getDisplayedElement(".header-logo", { timeout: 5000 });
  return handle;
}

async function loadOptionsTab(optionsHandle, id) {
  await driver.switchTo().window(optionsHandle);

  await driver.wait(
    async () => {
      try {
        await clickOnDisplayedElement(`[href="#${id}"]`);
        return true;
      } catch (err) {
        if (err.name !== "NoSuchElementError" && err.name !== "StaleElementReferenceError") {
          throw err;
        }
        // The options page has stale elements, reloading as a workaround
        await driver.navigate().refresh();
        await driver.sleep(optionsPageSleep); // https://eyeo.atlassian.net/browse/EXT-335
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

export async function initOptionsFiltersTab(optionsHandle) {
  await loadOptionsTab(optionsHandle, "filters");
  // Wait until a filterlist is displayed
  await getDisplayedElement('[name="easylist"]', { timeout: 8000 });
}

export async function initOptionsCustomizeTab(optionsHandle) {
  await loadOptionsTab(optionsHandle, "customize");
}

export async function initOptionsGeneralTab(optionsHandle) {
  await loadOptionsTab(optionsHandle, "general");
  await waitForNotNullAttribute("acceptable_ads", "checked");
  await driver.sleep(optionsPageSleep); // https://eyeo.atlassian.net/browse/EXT-335
}

export async function initOptionsPremiumTab(optionsHandle) {
  await loadOptionsTab(optionsHandle, "mab");
  await driver.sleep(optionsPageSleep); // https://eyeo.atlassian.net/browse/EXT-335
  await driver.navigate().refresh(); // Workaround for the "get-it-now" element to appear
}

export async function initOptionsThemesTab(optionsHandle) {
  await loadOptionsTab(optionsHandle, "mab-themes");
}

export async function initOptionsImageSwapTab(optionsHandle) {
  await loadOptionsTab(optionsHandle, "mab-image-swap");
}

export async function initOptionsBackupSyncTab(optionsHandle) {
  await loadOptionsTab(optionsHandle, "sync");
}

export async function initOptionsPremiumFlTab(optionsHandle) {
  await loadOptionsTab(optionsHandle, "premium-filters");
  await getDisplayedElement("#premium-filter-lists > div:nth-child(2)", { timeout: 2000 });
}

export async function getCustomFilters() {
  const filters = await waitForNotNullAttribute("txtFiltersAdvanced", "value", 2000);
  return filters.split("\n");
}

export async function setCustomFilters(filters, append = false) {
  const editButton = await getDisplayedElement("#btnEditAdvancedFilters", { timeout: 2000 });

  // The edit button functionality may take some time to be ready.
  // Retrying as a workaround
  let saveButton;
  await driver.wait(
    async () => {
      try {
        await editButton.click();
        saveButton = await getDisplayedElement("#btnSaveAdvancedFilters", { forceRefresh: false });
        return true;
      } catch (e) {}
    },
    5000,
    "btnSaveAdvancedFilters was not displayed",
  );

  const filtersAdvancedElem = await getDisplayedElement("#txtFiltersAdvanced");
  if (!append) {
    await filtersAdvancedElem.clear();
  }

  for (const filter of filters) {
    await filtersAdvancedElem.sendKeys(Key.RETURN);
    await filtersAdvancedElem.sendKeys(filter);
  }
  await saveButton.click();
}

export async function getUserIdFromInstallPage() {
  await findUrl(installUrl);

  let userId;
  await driver.wait(
    async () => {
      try {
        userId = await driver.executeScript(() => {
          return document.getElementById("adblockUserId").textContent;
        });
        return true;
      } catch (err) {}
    },
    5000,
    "adblockUserId was not found",
  );

  return userId;
}

export async function getUserIdFromStorage(optionsHandle) {
  const currentHandle = await driver.getWindowHandle();

  await driver.switchTo().window(optionsHandle);
  const userId = await driver.executeAsyncScript(async (callback) => {
    const res = await browser.storage.local.get("userid");
    callback(res.userid);
  });

  await driver.switchTo().window(currentHandle);
  return userId;
}

export async function getSubscriptionInfo(name, timeout = 5000) {
  let text;
  await driver.wait(
    async () => {
      const info = await driver.findElement(By.css(`[name="${name}"] .subscription_info`));
      text = await info.getText();
      return text !== "";
    },
    timeout,
    `Getting subscription ${name} info timeod out after ${timeout}ms`,
  );

  return text;
}

// This function assumes initOptionsFiltersTab() being called beforehand
export async function clickFilterlist(name, id, enabledAfterClick) {
  await clickOnDisplayedElement(`[name="${name}"]`);

  // Language filter lists get removed from the UI after disabling them.
  // In that case no further checks are done here
  if (!id) {
    return;
  }

  const text = enabledAfterClick ? "enabled" : "disabled";
  await driver.wait(
    async () => {
      return (await isCheckboxEnabled(id)) === enabledAfterClick;
    },
    1000,
    `The filterlist "${name}" was not ${text} after clicking`,
  );
}

/**
 * Add filters to AdBlock
 *
 * @param {string} filters - The filter rules to add
 * @returns {Promise<void>}
 */
export async function addFiltersToAdBlock(filters) {
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
 * @param {boolean} [expectAllowlisted=false] - Whether the page is allowlisted
 * @returns {Promise<void>}
 */
export async function checkBlockHidePage(expectAllowlisted) {
  let expectedPopadsText = "pop_ads.js was blocked";
  let expectedBanneradsText = "bannerads/* was blocked";

  if (expectAllowlisted) {
    expectedPopadsText = "pop_ads.js blocking filter should block this";
    expectedBanneradsText = "first bannerads/* blocking filter should block this";
  }

  await driver.wait(
    async () => {
      const popadsElem = await getDisplayedElement("#popads-blocking-filter");
      const banneradsElem = await getDisplayedElement("#bannerads-blocking-filter");

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

  const timeout = 2000;
  if (expectAllowlisted) {
    await getDisplayedElement("#search-ad", { timeout });
    await getDisplayedElement("#AdContainer", { timeout });
  } else {
    await waitForNotDisplayed("#search-ad", timeout);
    await waitForNotDisplayed("#AdContainer", timeout);
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
  // Extension pages will be closed during reload,
  // create a new tab to avoid the "target window already closed" error
  const safeHandle = await openNewTab(localTestPageUrl);

  // ensure options page is open
  await initOptionsGeneralTab(getOptionsHandle());

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
        await driver.navigate().to(`${extension.origin}/options.html`);
        await waitForNotNullAttribute("acceptable_ads", "checked", 5000);
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
  const currentHandle = await driver.getWindowHandle();
  const optionsHandle = getOptionsHandle();
  if (currentHandle !== optionsHandle) {
    await initOptionsGeneralTab(getOptionsHandle());
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

export async function checkPremiumPageHeader(ctaTextSelector, ctaLinkSelector, premiumURL) {
  // sometimes the elements are displayed with a delay
  const ctaText = await getDisplayedElement(ctaTextSelector, {
    timeout: 4000,
    forceRefresh: false,
  });
  expect(await ctaText.getText()).toEqual(
    "You’ll be an ad blocking pro with these easy-to-use add-ons.",
  );

  const ctaLink = await getDisplayedElement(ctaLinkSelector);
  expect(await ctaLink.getText()).toEqual("Get It Now");

  await clickAndCloseNewTab(ctaLinkSelector, premiumURL);
}

export async function setAADefaultState() {
  const name = "acceptable_ads";
  const inputId = "adblockFilterList_0";

  await initOptionsFiltersTab(getOptionsHandle());
  const aaEnabled = await isCheckboxEnabled(inputId);
  // Cleanup setting the AA default state
  if (
    (browserDetails.expectAAEnabled && !aaEnabled) ||
    (!browserDetails.expectAAEnabled && aaEnabled)
  ) {
    await clickFilterlist(name, inputId, browserDetails.expectAAEnabled);
  }
}

export async function waitForSubscribed(
  name,
  inputId,
  { timeout = 3000, allowFetching = false } = {},
) {
  const regexp = allowFetching ? /updated|Subscribed|Fetching/ : /updated|Subscribed/;

  await driver.wait(
    async () => {
      const flEnabled = await isCheckboxEnabled(inputId);
      const text = await getSubscriptionInfo(name);
      return flEnabled && regexp.test(text);
    },
    timeout,
    `${name} was not updated/subscribed/fetching after adding it`,
  );
}

export async function setPausedStateFromPopup(url, paused = true) {
  const pauseBtnSelector = "[data-text='domain_pause_adblock']";
  const unpauseBtnSelector = "[data-text='unpause_adblock']";
  const beforeClickBtn = paused ? pauseBtnSelector : unpauseBtnSelector;
  const afterClickBtn = paused ? unpauseBtnSelector : pauseBtnSelector;

  // open new tab with the URL that will be allowlisted
  const websiteHandle = await openNewTab(url);

  // initialize the popup for the above page
  const tabId = await getTabId(getOptionsHandle());
  await initPopupPage(tabId);

  // click on the 'Pause' or 'Unpause' button
  await clickOnDisplayedElement(beforeClickBtn, {
    timeout: 5000,
    checkDisplayed: false, // Sometimes isDisplayed() returns false, even though the button can be clicked
  });

  await driver.switchTo().window(websiteHandle);
  await driver.navigate().refresh();

  // re-open the popup and check state changed
  await initPopupPage(tabId);
  await getDisplayedElement(afterClickBtn, {
    timeout: 5000,
    forceRefresh: false,
    checkDisplayed: false,
  });
  await driver.close();

  // switch to the page
  await driver.switchTo().window(websiteHandle);
  await driver.close();
  await driver.switchTo().window(getOptionsHandle());
}

export async function getPopupBlockedAdsTotalCount() {
  // The popup page needs any tabId to show total ads blocked. The test page
  // is used for that, since it doesn't have any blocking elements
  const websiteHandle = await openNewTab(localTestPageUrl);
  const tabId = await getTabId(getOptionsHandle());
  const popupHandle = await initPopupPage(tabId);

  const elem = await getDisplayedElement(
    "#popup_sections popup-detail-stats > div:nth-child(2) > span",
    { timeout: 2000, forceRefresh: false },
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
  const currentDate = new Date();
  const options = { year: "numeric", month: "long" };
  const formattedDate = currentDate.toLocaleDateString("en-US", options).toUpperCase();
  const expectedValues = [`SUPPORTER SINCE ${formattedDate}`, "ACTIVE"];

  let premiumStatus;
  // Occasionally the `adblock:activate` message has no effect in the premium
  // status. In that case the activation flow is retried.
  await driver.wait(
    async () => {
      await sendExtMessage({ type: "adblock:activate" }); // activate premium
      await initOptionsPremiumTab(getOptionsHandle());

      try {
        premiumStatus = await getDisplayedElement("#premium_status_msg", {
          timeout: 4000, // Premium status message may take a while to appear
          forceRefresh: false,
        });
        return true;
      } catch (err) {
        if (err.name === "TimeoutError") {
          console.warn("Temporary premium wasn't activated. Retrying...");
          return false;
        }

        throw err;
      }
    },
    10000,
    "Temporary premium couldn't be activated",
  );

  const premiumStatusText = await premiumStatus.getText();
  if (!expectedValues.includes(premiumStatusText)) {
    throw new Error(`Unexpected premium status after activation: ${premiumStatusText}`);
  }
}

export async function waitForAdsBlockedToBeInRange(min, max) {
  let adsBlocked;
  try {
    await driver.wait(async () => {
      adsBlocked = await getPopupBlockedAdsTotalCount();
      return adsBlocked > min && adsBlocked <= max;
    });
  } catch (err) {
    throw new Error(
      `Unexpected ads blocked count. Expected: ${min} < value <= ${max}. Actual: ${adsBlocked}`,
    );
  }
  return adsBlocked;
}
