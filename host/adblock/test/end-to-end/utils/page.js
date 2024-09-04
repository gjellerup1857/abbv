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

import { waitForDisplayed } from "./driver.js";

const { By } = webdriver;

export async function initPopupPage({ driver, origin }, tabId) {
  await driver.switchTo().newWindow("tab");
  await driver.navigate().to(`${origin}/adblock-button-popup.html?tabId=${tabId}`);
}

export async function initFiltersPage({ driver, optionsHandle }) {
  await driver.switchTo().window(optionsHandle);
  await driver.findElement(By.css('[href="#filters"]')).click();
  // Wait until a filterlist is displayed
  await waitForDisplayed({ driver }, '[name="easylist"]');
}
