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

import { getDisplayedElement, openNewTab, findUrl, waitForNotNullAttribute } from "./driver.js";

const { By, Key } = webdriver;

export const installUrl = "getadblock.com/en/installed";

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

export async function getUserId(driver) {
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

export async function getSubscriptionInfo(driver, name) {
  let text;
  await driver.wait(async () => {
    const info = await driver.findElement(By.css(`[name="${name}"] .subscription_info`));
    text = await info.getText();
    return text !== "";
  });

  return text;
}

export async function clickFilterlist(driver, name) {
  await driver.findElement(By.css(`[name="${name}"]`)).click();
}
