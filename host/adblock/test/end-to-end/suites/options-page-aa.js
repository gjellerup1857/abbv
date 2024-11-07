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

import { isCheckboxEnabled, getDisplayedElement } from "../utils/driver.js";
import { initOptionsGeneralTab, initOptionsFiltersTab, setAADefaultState } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";

export default () => {
  after(async function () {
    const { driver, expectAAEnabled } = this;
    await setAADefaultState(driver, expectAAEnabled);
  });

  it("displays AA default state", async function () {
    const { driver, expectAAEnabled } = this;

    await initOptionsGeneralTab(driver, getOptionsHandle());
    await driver.wait(async () => {
      const aaEnabled = await isCheckboxEnabled(driver, "acceptable_ads");
      return aaEnabled === expectAAEnabled;
    });
    const aaPrivacyEnabled = await isCheckboxEnabled(driver, "acceptable_ads_privacy");
    expect(aaPrivacyEnabled).toEqual(false);

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const aaFLEnabled = await isCheckboxEnabled(driver, "adblockFilterList_0");
    expect(aaFLEnabled).toEqual(expectAAEnabled);
    const aaFLPrivacyEnabled = await isCheckboxEnabled(driver, "adblockFilterList_1");
    expect(aaFLPrivacyEnabled).toEqual(false);
  });

  it("only allows ads without third-party tracking", async function () {
    const { driver } = this;

    await initOptionsGeneralTab(driver, getOptionsHandle());
    let aaPrivacyEnabled = await isCheckboxEnabled(driver, "acceptable_ads_privacy");
    expect(aaPrivacyEnabled).toEqual(false);
    const aaPrivacy = await getDisplayedElement(driver, "label:has(> #acceptable_ads_privacy)");
    await aaPrivacy.click();
    aaPrivacyEnabled = await isCheckboxEnabled(driver, "acceptable_ads_privacy");
    expect(aaPrivacyEnabled).toEqual(true);
    const aaPrivacyHelper = await getDisplayedElement(driver, "#aa-privacy-helper > span", 4000);
    expect(await aaPrivacyHelper.getText()).toEqual(
      "For this feature to work properly, please enable Do Not Track (DNT) in your browser preferences.",
    );

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const aaFLPrivacyEnabled = await isCheckboxEnabled(driver, "adblockFilterList_1");
    expect(aaFLPrivacyEnabled).toEqual(true);
  });

  it("disables allow AA", async function () {
    const { driver } = this;

    await initOptionsGeneralTab(driver, getOptionsHandle());
    const aaEnabled = await isCheckboxEnabled(driver, "acceptable_ads");
    const aaCheckbox = await getDisplayedElement(driver, "span:has(> #acceptable_ads)");
    if (!aaEnabled) {
      // Enables AA so it can be disabled afterwards to get the info message
      await aaCheckbox.click();
    }
    await aaCheckbox.click(); // disables AA

    const aaInfo = await getDisplayedElement(driver, "#acceptable_ads_info > span", 2000, false);
    expect(await aaInfo.getText()).toEqual(
      "You're no longer subscribed to the Acceptable Ads filter list.",
    );
    const aaPrivacyEnabled = await isCheckboxEnabled(driver, "acceptable_ads_privacy");
    expect(aaPrivacyEnabled).toEqual(false);

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const aaFLEnabled = await isCheckboxEnabled(driver, "adblockFilterList_0");
    expect(aaFLEnabled).toEqual(false);
  });
};
