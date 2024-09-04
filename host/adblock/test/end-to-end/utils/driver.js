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

const { By } = webdriver;

export async function findUrl(driver, expectedUrl, timeout = 5000) {
  let url;
  let handle;
  await driver.wait(
    async () => {
      try {
        for (handle of await driver.getAllWindowHandles()) {
          await driver.switchTo().window(handle);
          url = await driver.getCurrentUrl();
          if (url.includes(expectedUrl)) {
            return true;
          }
        }
      } catch (err) {
        if (err.name !== "NoSuchWindowError") {
          throw err;
        }
      }
    },
    timeout,
    `${expectedUrl} was not found`,
  );

  return { url, handle };
}

// Gets the ID of current tab using the browser.tabs WebExtension API.
// This is mainly used to work with the popup when it is open in a tab.
export async function getTabId({ driver, optionsHandle }) {
  const currentHandle = await driver.getWindowHandle();
  const url = await driver.getCurrentUrl();
  const queryOptions = { url };

  await driver.switchTo().window(optionsHandle);
  const tabId = await driver.executeAsyncScript(
    async (params, callback) => {
      try {
        const tabs = await browser.tabs.query(params.queryOptions);
        if (tabs.length) {
          callback(tabs[0].id);
          return;
        }
      } catch (e) {}

      callback(browser.tabs.TAB_ID_NONE);
    },
    { queryOptions },
  );

  await driver.switchTo().window(currentHandle);
  return tabId;
}

export function waitForDisplayed({ driver }, cssText, timeout = 5000) {
  return driver.wait(
    async () => {
      try {
        const elem = driver.findElement(By.css(cssText));
        return await elem.isDisplayed();
      } catch (e) {}
    },
    timeout,
    `Element "${cssText}" was not displayed after ${timeout}ms`,
  );
}
