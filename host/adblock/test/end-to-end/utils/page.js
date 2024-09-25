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

export async function initOptionsFiltersTab(driver, optionsHandle) {
  await driver.switchTo().window(optionsHandle);
  await driver.findElement(By.css('[href="#filters"]')).click();
  // Wait until a filterlist is displayed
  await getDisplayedElement(driver, '[name="easylist"]', 8000);
}

export async function initOptionsCustomizeTab(driver, optionsHandle) {
  await driver.switchTo().window(optionsHandle);
  await driver.findElement(By.css('[href="#customize"]')).click();
}

export async function initOptionsGeneralTab(driver, optionsHandle) {
  await driver.switchTo().window(optionsHandle);
  await driver.findElement(By.css('[href="#general"]')).click();
  await waitForNotNullAttribute(driver, "acceptable_ads", "checked");
  // https://eyeo.atlassian.net/browse/EXT-335
  await driver.sleep(500);
}

export async function setCustomFilters(driver, filters) {
  const editButton = await getDisplayedElement(driver, "#btnEditAdvancedFilters", 2000);

  // The edit button functionality may take some time to be ready.
  // Retrying as a workaround
  let saveButton;
  await driver.wait(async () => {
    await editButton.click();
    try {
      // Remove textarea content
      await driver.executeScript(() => {
        document.getElementById("txtFiltersAdvanced").value = "";
      });
      saveButton = await getDisplayedElement(driver, "#btnSaveAdvancedFilters", 500);
      return true;
    } catch (e) {}
  });

  const filtersAdvancedElem = await getDisplayedElement(driver, "#txtFiltersAdvanced");
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
