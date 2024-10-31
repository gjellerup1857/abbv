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

import adFiltering from "./ad-filtering.js";
import {
  findUrl,
  getTabId,
  getDisplayedElement,
  openNewTab,
  isCheckboxEnabled,
} from "../utils/driver.js";
import {
  initPopupPage,
  initOptionsFiltersTab,
  installUrl,
  getUserIdFromPage,
  getSubscriptionInfo,
  clickFilterlist,
  reloadExtension,
} from "../utils/page.js";
import { setOptionsHandle, getOptionsHandle } from "../utils/hook.js";
import { getDefaultFilterLists } from "../utils/dataset.js";

const { By } = webdriver;

export default () => {
  it("opens the install url", async function () {
    const { driver, browserName, fullBrowserVersion, majorBrowserVersion } = this;
    const { url } = await findUrl(driver, installUrl);

    const userId = await getUserIdFromPage(driver);

    await driver.switchTo().window(getOptionsHandle());
    const appVersion = await driver.executeScript(() => {
      return browser.runtime.getManifest().version;
    });

    let browserVersion = `${majorBrowserVersion}.0.0.0`;
    let applicationVersion = browserVersion;
    if (browserName === "firefox") {
      applicationVersion = fullBrowserVersion;
      const navigatorText = await driver.executeScript(() => {
        return navigator.userAgent;
      });
      browserVersion = navigatorText.match(/(?<=rv:)(\d|\.)+/)[0];
    }

    const base = {
      lg: expect.stringMatching(/^[a-z]+-/),
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
    }[browserName];
    if (!expectedParams) {
      throw new Error(`Browser name not recognized: ${browserName}`);
    }

    const params = new URLSearchParams(new URL(url).search);
    const actualParams = Object.fromEntries(params);

    expect(actualParams).toEqual(expectedParams);
  });

  it("displays total ad block count", async function () {
    const { driver, popupUrl } = this;

    const url =
      "https://adblockinc.gitlab.io/QA-team/adblocking/adblocked-count/adblocked-count-testpage.html";
    const maxAdsBlocked = 15;

    const getAdsBlockedCount = async () => {
      const countElem = await getDisplayedElement(
        driver,
        "popup-detail-stats > div:nth-child(2) .count-numbers",
        2000,
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
    const tabId = await getTabId(driver, getOptionsHandle());
    await initPopupPage(driver, popupUrl, tabId);

    const blockedFirst = await waitForAdsBlockedToBeInRange(0, maxAdsBlocked);

    await findUrl(driver, url);
    await driver.navigate().refresh();
    await initPopupPage(driver, popupUrl, tabId);

    await waitForAdsBlockedToBeInRange(blockedFirst, maxAdsBlocked);
  });

  it("resets settings", async function () {
    const { driver, browserName } = this;
    const enabledFilterLists = getDefaultFilterLists(browserName).filter(({ enabled }) => enabled);

    const handleDisabledFilterlistsAlert = async () => {
      let alert;
      await driver.wait(async () => {
        try {
          alert = await driver.switchTo().alert();
          return true;
        } catch (err) {
          if (err.name !== "NoSuchAlertError") {
            throw err;
          }
          throw new Error("No alert was displayed after disabling all filterlists");
        }
      });
      expect(await alert.getText()).toEqual(
        "AdBlock can't block ads if you disable all the filter lists. We " +
          "recommend pausing AdBlock instead. Unsubscribe from this list anyway?",
      );

      await alert.accept();
    };

    await initOptionsFiltersTab(driver, getOptionsHandle());

    let lastInputId;
    // Disable the initially enabled filterlists
    const amount = enabledFilterLists.length;
    for (const [i, { name, inputId }] of enabledFilterLists.entries()) {
      let id = inputId;
      if (i + 1 === amount) {
        // Disabling the last filterlist raises an alert. Passing a null id to
        // prevent clickFilterlist() doing any checks after clicking
        id = null;
        lastInputId = inputId;
      }

      await clickFilterlist(driver, name, id, false);
    }

    await handleDisabledFilterlistsAlert();
    const aaEnabled = await isCheckboxEnabled(driver, lastInputId);
    expect(aaEnabled).toEqual(false);

    // reload the extension to restore the default settings
    await reloadExtension();

    await initOptionsFiltersTab(driver, getOptionsHandle());
    for (const { name } of enabledFilterLists) {
      const text = await getSubscriptionInfo(driver, name);
      expect(text).toMatch(/(updated|Subscribed)/);
    }
  });

  describe("Ad Filtering", adFiltering);
};
