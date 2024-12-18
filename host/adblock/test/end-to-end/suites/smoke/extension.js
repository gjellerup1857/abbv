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

import { findUrl, openNewTab, isCheckboxEnabled } from "@eyeo/test-utils/driver";
import { blockHideUrl } from "@eyeo/test-utils/urls";
import { getOptionsHandle, reloadExtension } from "@eyeo/test-utils/extension";

import {
  initOptionsFiltersTab,
  getUserIdFromInstallPage,
  getSubscriptionInfo,
  clickFilterlist,
  waitForAdsBlockedToBeInRange,
  expectAAEnabled,
  initOptionsGeneralTab,
} from "../../utils/page.js";
import { getDefaultFilterLists } from "../../utils/dataset.js";
import { installUrl } from "../../utils/urls.js";

export default () => {
  it("opens the install url", async function () {
    const { url } = await findUrl(installUrl);

    const userId = await getUserIdFromInstallPage();

    await driver.switchTo().window(getOptionsHandle());
    const appVersion = await driver.executeScript(() => {
      return browser.runtime.getManifest().version;
    });

    let browserVersion = `${browserDetails.majorBrowserVersion}.0.0.0`;
    let applicationVersion = browserVersion;
    if (browserDetails.browserName === "firefox") {
      applicationVersion = browserDetails.fullBrowserVersion;
      const navigatorText = await driver.executeScript(() => {
        return navigator.userAgent;
      });
      [browserVersion] = navigatorText.match(/(?<=rv:)(\d|\.)+/);
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
    }[browserDetails.browserName];
    if (!expectedParams) {
      throw new Error(`Browser name not recognized: ${browserDetails.browserName}`);
    }

    const params = new URLSearchParams(new URL(url).search);
    const actualParams = Object.fromEntries(params);

    expect(actualParams).toEqual(expectedParams);
  });

  it("displays total ad block count", async function () {
    const maxAdsBlocked = 15;

    const websiteHandle = await openNewTab(blockHideUrl);
    const blockedFirst = await waitForAdsBlockedToBeInRange(0, maxAdsBlocked);

    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();

    await waitForAdsBlockedToBeInRange(blockedFirst, maxAdsBlocked);
  });

  it("resets settings", async function () {
    this.timeout(50000); // The options page may take long time to appear after reloading the extension

    const enabledFilterLists = getDefaultFilterLists(expectAAEnabled).filter(
      ({ enabled }) => enabled,
    );

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

    await initOptionsFiltersTab(getOptionsHandle());

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

      await clickFilterlist(name, id, false);
    }

    await handleDisabledFilterlistsAlert();
    const aaEnabled = await isCheckboxEnabled(lastInputId);
    expect(aaEnabled).toEqual(false);

    // If the extension is reloaded right after AA is disabled,
    // restoring the default settings may not work with AA
    await driver.sleep(5000);

    // reload the extension to restore the default settings
    await reloadExtension(initOptionsGeneralTab);

    await initOptionsFiltersTab(getOptionsHandle());
    for (const { name } of enabledFilterLists) {
      const text = await getSubscriptionInfo(name);
      expect(text).toMatch(/(updated|Subscribed)/);
    }
  });
};
