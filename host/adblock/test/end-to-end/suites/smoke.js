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

import { findUrl, getTabId, getDisplayedElement, openNewTab } from "../utils/driver.js";
import { initPopupPage, initFiltersPage } from "../utils/page.js";

const { By } = webdriver;

export default () => {
  beforeEach(async function () {
    await this.driver.switchTo().window(this.optionsHandle);
  });

  it("opens the install url", async function () {
    const { driver, browser, fullBrowserVersion } = this;
    const installUrl = "getadblock.com/en/installed";
    const { url } = await findUrl(driver, installUrl);

    let userId;
    await driver.wait(async () => {
      try {
        userId = await driver.executeScript(() => {
          return document.getElementById("adblockUserId").textContent;
        });
        return true;
      } catch (err) {}
    });

    await driver.switchTo().window(this.optionsHandle);
    const appVersion = await driver.executeScript(() => {
      return browser.runtime.getManifest().version;
    });

    // to be extracted to checkInstallUninstallUrl
    let browserVersion = `${this.majorBrowserVersion}.0.0.0`;
    let applicationVersion = browserVersion;
    if (this.browser === "firefox") {
      applicationVersion = fullBrowserVersion;
      const navigatorText = await driver.executeScript(() => {
        return navigator.userAgent;
      });
      browserVersion = navigatorText.match(/(?<=rv:)(\d|\.)+/)[0];
    }

    const base = {
      lg: "en-US",
      av: appVersion,
      u: userId,
      pv: browserVersion,
      apv: applicationVersion,
    };
    const expectedParams = {
      chromium: {
        ...base,
        an: "adblockchrome",
        ap: "chrome",
        p: "chromium",
      },
      edge: {
        ...base,
        an: "adblockchrome",
        ap: "edg",
        p: "chromium",
      },
      firefox: {
        ...base,
        an: "adblockfirefox",
        ap: "firefox",
        p: "gecko",
      },
    }[this.browser];
    if (!expectedParams) {
      throw new Error(`Browser name not recognized: ${this.browser}`);
    }

    const params = new URLSearchParams(new URL(url).search);
    const actualParams = Object.fromEntries(params);

    expect(actualParams).toEqual(expectedParams);
  });

  it("displays total ad block count", async function () {
    const { driver, optionsHandle } = this;
    const url =
      "https://adblockinc.gitlab.io/QA-team/adblocking/adblocked-count/adblocked-count-testpage.html";
    const maxAdsBlocked = 15;

    const getAdsBlockedCount = async () => {
      const countElem = await getDisplayedElement(
        driver,
        "popup-detail-stats > div:nth-child(2) .count-numbers",
      );
      return parseInt(await countElem.getText(), 10);
    };

    const waitForAdsBlockedToBeInRange = async (min, max) => {
      let adsBlocked;
      try {
        await driver.wait(async () => {
          await driver.navigate().refresh();
          adsBlocked = await getAdsBlockedCount();
          return adsBlocked > min && adsBlocked <= max;
        });
      } catch (err) {
        throw new Error(
          `Unexpected ads blocked count. Expected: ${min} < value <= ${max}. Actual: ${adsBlocked}`,
        );
      }
      return adsBlocked;
    };

    await openNewTab(driver, url);
    const tabId = await getTabId(driver, optionsHandle);
    await initPopupPage(this, tabId);

    const blockedFirst = await waitForAdsBlockedToBeInRange(0, maxAdsBlocked);
    await driver.close();

    await findUrl(driver, url);
    await driver.navigate().refresh();
    await initPopupPage(this, tabId);

    await waitForAdsBlockedToBeInRange(blockedFirst, maxAdsBlocked);
    await driver.close();

    await findUrl(driver, url);
    await driver.close();
  });

  it("resets settings", async function () {
    const { driver, origin, browser } = this;

    await driver.switchTo().newWindow("tab");
    const safeHandle = await driver.getWindowHandle();

    await initFiltersPage(this);

    const filterLists = ["easylist", "anticircumvent"];
    if (this.browser !== "firefox") {
      filterLists.push("acceptable_ads"); // disabled by default on Firefox
    }

    let filterList;
    for (filterList of filterLists) {
      await driver.findElement(By.css(`[name="${filterList}"]`)).click();
    }

    let alert;
    await driver.wait(async () => {
      try {
        alert = await driver.switchTo().alert();
        return true;
      } catch (err) {
        if (err.name !== "NoSuchAlertError") {
          throw err;
        }
        // the last filterlist didn't trigger the alert, retrying
        await driver.findElement(By.css(`[name="${filterList}"]`)).click();
      }
    });
    expect(await alert.getText()).toEqual(
      "AdBlock can't block ads if you disable all the filter lists. We " +
        "recommend pausing AdBlock instead. Unsubscribe from this list anyway?",
    );
    await alert.accept();

    await driver.executeScript(() => browser.runtime.reload());
    // Workaround for `target window already closed`
    await driver.switchTo().window(safeHandle);

    // Only Firefox triggers the updated page
    if (browser === "firefox") {
      await findUrl(driver, "getadblock.com/en/update");
      await driver.close();
      await driver.switchTo().window(safeHandle);
    }

    await driver.wait(
      async () => {
        try {
          await driver.navigate().to(`${origin}/options.html`);
          await driver.findElement(By.css('[href="#general"]'));
          return true;
        } catch (e) {
          await driver.navigate().refresh();
        }
      },
      15000,
      "Options page not found after reload",
      1000,
    );
    // Updating to the new options handle
    this.optionsHandle = await driver.getWindowHandle();

    await initFiltersPage(this);
    for (const filterList of filterLists) {
      let text;
      await driver.wait(async () => {
        const info = driver.findElement(By.css(`[name="${filterList}"] .subscription_info`));
        text = await info.getText();
        return text != "";
      });
      expect(text).toMatch(/updated/);
    }
  });
};
