/* eslint-disable max-len */
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

"use strict";

const { beforeSequence, uninstallExtension, isEdge } = require("../helpers");
const { expect } = require("chai");
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
const moment = require("moment");

describe("Smoke Tests - Uninstall with custom settings", function () {
  before(async function () {
    await beforeSequence();
  });

  it("uninstalls the extension with custom settings", async function () {
    // https://eyeo.atlassian.net/browse/EXT-153
    if (isEdge()) this.skip();

    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    await generalPage.clickAllowAcceptableAdsCheckbox();
    expect(await generalPage.isAllowAcceptableAdsCheckboxSelected(false, 5000));
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLStatusToggle();
    expect(await advancedPage.isEasyListFLStatusToggleSelected()).to.be.false;
    // Wait for FL to be properly removed
    await browser.pause(1000);

    const url = await uninstallExtension();

    // https://eyeo.atlassian.net/browse/EXT-153
    if (url === null) this.skip();

    const todaysDate = moment().utc().format("YYYYMMDD");
    const { searchParams } = new URL(url);
    expect(searchParams.get("s")).to.equal("0");
    expect(searchParams.get("c")).to.equal("0");
    expect(searchParams.get("fv")).to.equal(todaysDate);
  });
});
