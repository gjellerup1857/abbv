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

import { findUrl, getTabId } from "../utils/driver.js";
import { initPopupPage, initFiltersPage } from "../utils/page.js";

const { By } = webdriver;

export default () => {
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
};
