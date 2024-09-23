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

import { waitForNotNullAttribute, getDisplayedElement } from "../utils/driver.js";
import { initOptionsGeneralTab, initOptionsFiltersTab } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";

export default () => {
  after(async function () {
    const { driver, browserName } = this;
    const expectAAEnabled = browserName !== "firefox";

    await initOptionsGeneralTab(driver, getOptionsHandle());
    const aaEnabled = await waitForNotNullAttribute(driver, "acceptable_ads", "checked");
    // Cleanup setting the AA default state
    if ((expectAAEnabled && !aaEnabled) || (!expectAAEnabled && aaEnabled)) {
      const aaCheckbox = await getDisplayedElement(driver, "span:has(> #acceptable_ads)");
      await aaCheckbox.click();
    }
  });

  it("displays AA default state", async function () {
    const { driver, browserName } = this;
    // By default AA is enabled on Chrome and disabled on Firefox
    const expectAAEnabled = browserName !== "firefox";

    await initOptionsGeneralTab(driver, getOptionsHandle());
    await driver.wait(async () => {
      const aaEnabled = await waitForNotNullAttribute(driver, "acceptable_ads", "checked");
      return aaEnabled === expectAAEnabled;
    });
    const aaPrivacyEnabled = await waitForNotNullAttribute(
      driver,
      "acceptable_ads_privacy",
      "checked",
    );
    expect(aaPrivacyEnabled).toEqual(false);

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const aaFLEnabled = await waitForNotNullAttribute(driver, "adblockFilterList_0", "checked");
    expect(aaFLEnabled).toEqual(expectAAEnabled);
    const aaFLPrivacyEnabled = await waitForNotNullAttribute(
      driver,
      "adblockFilterList_1",
      "checked",
    );
    expect(aaFLPrivacyEnabled).toEqual(false);
  });

  it("only allows ads without third-party tracking", async function () {
    const { driver } = this;

    await initOptionsGeneralTab(driver, getOptionsHandle());
    let aaPrivacyEnabled = await waitForNotNullAttribute(
      driver,
      "acceptable_ads_privacy",
      "checked",
    );
    expect(aaPrivacyEnabled).toEqual(false);
    const aaPrivacy = await getDisplayedElement(driver, "label:has(> #acceptable_ads_privacy)");
    await aaPrivacy.click();
    aaPrivacyEnabled = await waitForNotNullAttribute(driver, "acceptable_ads_privacy", "checked");
    expect(aaPrivacyEnabled).toEqual(true);
    const aaPrivacyHelper = await getDisplayedElement(driver, "#aa-privacy-helper > span", 4000);
    expect(await aaPrivacyHelper.getText()).toEqual(
      "For this feature to work properly, please enable Do Not Track (DNT) in your browser preferences.",
    );

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const aaFLPrivacyEnabled = await waitForNotNullAttribute(
      driver,
      "adblockFilterList_1",
      "checked",
    );
    expect(aaFLPrivacyEnabled).toEqual(true);
  });

  it("disables allow AA", async function () {
    const { driver } = this;

    await initOptionsGeneralTab(driver, getOptionsHandle());
    const aaEnabled = await waitForNotNullAttribute(driver, "acceptable_ads", "checked");
    const aaCheckbox = await getDisplayedElement(driver, "span:has(> #acceptable_ads)");
    if (!aaEnabled) {
      // Enables AA so it can be disabled afterwards to get the info message
      await aaCheckbox.click();
    }
    await aaCheckbox.click(); // disables AA

    const aaInfo = await getDisplayedElement(driver, "#acceptable_ads_info > span", 2000);
    expect(await aaInfo.getText()).toEqual(
      "You're no longer subscribed to the Acceptable Ads filter list.",
    );
    const aaPrivacyEnabled = await waitForNotNullAttribute(
      driver,
      "acceptable_ads_privacy",
      "checked",
    );
    expect(aaPrivacyEnabled).toEqual(false);

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const aaFLEnabled = await waitForNotNullAttribute(driver, "adblockFilterList_0", "checked");
    expect(aaFLEnabled).toEqual(false);
  });
};
