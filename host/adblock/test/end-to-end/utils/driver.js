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
export async function getTabId(driver, optionsHandle) {
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

// The forceRefresh parameter is a temporary workaround, to be removed when fixing
// https://eyeo.atlassian.net/browse/EXT-335
export async function getDisplayedElement(driver, cssText, timeout = 500, forceRefresh = true) {
  let elem;
  const findElement = async () => {
    await driver.wait(
      async () => {
        try {
          elem = await driver.findElement(By.css(cssText));
          return await elem.isDisplayed();
        } catch (e) {}
      },
      timeout,
      `Element "${cssText}" was not displayed after ${timeout}ms`,
    );
  };

  try {
    await findElement();
  } catch (err) {
    if (!forceRefresh) {
      throw err;
    }

    // eslint-disable-next-line no-console
    console.warn(`Element "${cssText}" is not displayed, refreshing the page and retrying...`);
    await driver.navigate().refresh();
    await findElement();
  }

  return elem;
}

export async function openNewTab(driver, url) {
  await driver.switchTo().newWindow("tab");
  await driver.navigate().to(url);
}

export function waitForNotDisplayed(driver, cssText, timeout = 1000) {
  return driver.wait(
    async () => {
      try {
        await getDisplayedElement(driver, cssText, 500, false);
        return false;
      } catch (err) {
        if (err.name === "TimeoutError") {
          return true;
        }
        throw err;
      }
    },
    timeout,
    `Element "${cssText}" was still displayed after ${timeout}ms`,
  );
}

export async function waitForNotNullAttribute(driver, id, attribute, timeout = 1000) {
  let value;
  await driver.wait(
    async () => {
      try {
        // The attribute value of hidden elements is not always returned by
        // element.getAttribute(). Using a script as a workaround
        value = await driver.executeScript(
          (elemId, attr) => {
            return document.getElementById(elemId)[attr];
          },
          id,
          attribute,
        );
        return value !== null;
      } catch (e) {}
    },
    timeout,
    `Attribute "${attribute}" of element "${id}" was still null after ${timeout}ms`,
  );
  return value;
}
