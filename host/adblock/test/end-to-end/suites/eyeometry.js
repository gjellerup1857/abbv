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

// import { isCheckboxEnabled, getDisplayedElement } from "../utils/driver.js";
// import { initOptionsGeneralTab, initOptionsFiltersTab, setAADefaultState } from "../utils/page.js";
// import { getOptionsHandle } from "../utils/hook.js";

async function getStorage(driver, storage, key) {
  return driver.executeAsync(async (params, callback) => {
    browser.storage[params.storage].get([params.key])
      .then(result => callback(result[params.key]));
  }, { storage, key });
}

export default () => {
  // it("displays AA default state", async function () {
  //   const { driver } = this;

  //   await initOptionsGeneralTab(driver, getOptionsHandle());
  //   await driver.wait(async () => {
  //     const aaEnabled = await isCheckboxEnabled(driver, "acceptable_ads");
  //     return aaEnabled === expectAAEnabled;
  //   });
  //   const aaPrivacyEnabled = await isCheckboxEnabled(driver, "acceptable_ads_privacy");
  //   expect(aaPrivacyEnabled).toEqual(false);

  //   await initOptionsFiltersTab(driver, getOptionsHandle());
  //   const aaFLEnabled = await isCheckboxEnabled(driver, "adblockFilterList_0");
  //   expect(aaFLEnabled).toEqual(expectAAEnabled);
  //   const aaFLPrivacyEnabled = await isCheckboxEnabled(driver, "adblockFilterList_1");
  //   expect(aaFLPrivacyEnabled).toEqual(false);
  // });

  it("sends request and saves the data in the storage", async function () {
    const { driver, browserName } = this;

    const timeout = 10000;
    const timeoutMsg = `No storage data after ${timeout}ms`;
    let data;

    try {
      data = await driver.wait(
        async () => {
          return getStorage(driver, "local", "ewe:telemetry");
        },
        timeout,
        timeoutMsg,
      );
    } catch (e) {
      if (browserName !== "firefox") {
        throw e;
      } else {
        // It's Firefox and no storage data was saved, all good
        return;
      }
    }

    if (browserName !== "firefox") {
      expect(data).toEqual(expect.objectContaining({
        firstPing: expect.any(String),
        lastPing: expect.any(String),
        lastPingTag: expect.any(String)
      }));
    } else {
      expect.fail("No telemetry data saved is expected on Firefox");
    }
  });
};
