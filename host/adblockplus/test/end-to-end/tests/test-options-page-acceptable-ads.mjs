/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import { expect } from "chai";

import GeneralPage from "../page-objects/general.page.js";
import AdvancedPage from "../page-objects/advanced.page.js";
import AcceptableAdsDialogChunk from "../page-objects/acceptableAdsDialog.chunk.js";

export default () => {
  it("should display AA default state", async function () {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.isAllowAcceptableAdsCheckboxSelected()).to.be.true;
    expect(
      await generalPage.isOnlyAllowAdsWithoutTrackingCheckboxSelected(true)
    ).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.isAllowNonintrusiveAdvertisingFLDisplayed()).to.be
      .true;
  });

  it("should only allow ads without third-party tracking", async function () {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickOnlyAllowAdsWithoutTrackingCheckbox();
    if (
      (await generalPage.isOnlyAllowAdsWithoutTrackingCheckboxSelected(
        true,
        1000
      )) == true
    ) {
      await generalPage.clickOnlyAllowAdsWithoutTrackingCheckbox();
    }
    expect(await generalPage.isOnlyAllowAdsWithoutTrackingCheckboxSelected()).to
      .be.true;
    expect(await generalPage.isDoNotTrackNoteParagraphDisplayed()).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(
      await advancedPage.isAllowNonintrusiveAdvertisingWithoutTrackingFLDisplayed()
    ).to.be.true;
    expect(await advancedPage.isAllowNonintrusiveAdvertisingFLDisplayed()).to.be
      .false;
  });

  it("should disable allow acceptable ads", async function () {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAllowAcceptableAdsCheckbox();
    if (
      (await generalPage.isAllowAcceptableAdsCheckboxSelected(false, 1000)) ==
      true
    ) {
      await generalPage.clickAllowAcceptableAdsCheckbox();
    }
    expect(await generalPage.isAllowAcceptableAdsCheckboxSelected(true)).to.be
      .true;
    const acceptableAdsDialogChunk = new AcceptableAdsDialogChunk(browser);
    expect(await acceptableAdsDialogChunk.isAADialogDisplayed()).to.be.true;
    await acceptableAdsDialogChunk.clickNoThanksButton();
    expect(await acceptableAdsDialogChunk.isAADialogDisplayed()).to.be.false;
    expect(await generalPage.isOnlyAllowAdsWithoutTrackingCheckboxEnabled()).to
      .be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(
      await advancedPage.isAllowNonintrusiveAdvertisingWithoutTrackingFLDisplayed()
    ).to.be.false;
    expect(await advancedPage.isAllowNonintrusiveAdvertisingFLDisplayed()).to.be
      .false;
  });
};
