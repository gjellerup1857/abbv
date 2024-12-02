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

const { expect } = require("chai");
const { uninstallExtension, isEdge } = require("../../helpers");
const checkInstallUninstallUrl = require("./shared/check-install-uninstall-url");

module.exports = function () {
  it("uninstalls the extension with default settings", async function () {
    // https://eyeo.atlassian.net/browse/EXT-153
    if (isEdge()) this.skip();

    const appVersion = await browser.executeScript(
      "return browser.runtime.getManifest().version;",
      []
    );

    const url = await uninstallExtension();

    // https://eyeo.atlassian.net/browse/EXT-153
    if (url === null) this.skip();

    await checkInstallUninstallUrl(url, appVersion);
    expect(url).contain("aa_a=true");
    expect(url).contain("p_s=false");
  });
};
