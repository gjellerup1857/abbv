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

const {doesTabExist, switchToABPOptionsTab} = require("../../helpers");
const {expect} = require("chai");
const PopupPage = require("../../page-objects/popup.page");

module.exports = function()
{
  let globalOrigin;

  before(function()
  {
    (globalOrigin = this.test.parent.parent.globalOrigin);
  });

  it("should open settings page", async function()
  {
    // make sure that the settings page is not opened by default
    await switchToABPOptionsTab();
    await browser.closeWindow();
    expect(await doesTabExist("Adblock Plus Options")).to.be.false;

    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    await popupPage.clickOptionsButton();
    expect(await doesTabExist("Adblock Plus Options")).to.be.true;
  });
};
