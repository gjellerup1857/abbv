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
import { sendExtCommand, updateExtPrefAPIKey } from "./shared/helpers.js";
import {
  addFilter,
  removeFilter,
  blockHideUrl,
  checkBlockHidePage,
  reloadExtension,
} from "../../utils/page.js";
import { openNewTab } from "../../utils/driver.js";

export default () => {
  before(async function () {
    await updateExtPrefAPIKey("bypass_authorizedKeys");
    await reloadExtension();
  });

  afterEach(async function () {
    await removeFilter("@@||adblockinc.gitlab.io^$document");
  });

  it("returns adblocking is active extension info", async function () {
    const { driver, extVersion, extName } = global;

    // open the block-hide page
    await openNewTab(driver, blockHideUrl);

    // send request extension info command
    const { extensionInfo } = await sendExtCommand({
      triggerEventName: "flattr-request-payload",
      responseEventName: "flattr-payload",
    });

    const expectedExtensionInfo = {
      name: extName.toLowerCase(),
      version: extVersion,
      allowlistState: {
        oneCA: true,
        source: null,
        status: false,
      },
    };

    expect(extensionInfo).toEqual(expectedExtensionInfo);
  });

  it("returns allowlisted page extension info", async function () {
    const { driver, extVersion, extName } = global;

    // open the block-hide page
    await openNewTab(driver, blockHideUrl);

    // ensure the page looks as it should before allowlisting
    await checkBlockHidePage(driver, { expectAllowlisted: false });

    // Allowlist the page
    await addFilter("@@||adblockinc.gitlab.io^$document");

    // Check that the page was allowlisted
    await checkBlockHidePage(driver, { expectAllowlisted: true });

    // send request extension info command
    const { extensionInfo } = await sendExtCommand({
      triggerEventName: "flattr-request-payload",
      responseEventName: "flattr-payload",
    });

    const expectedExtensionInfo = {
      name: extName.toLowerCase(),
      version: extVersion,
      allowlistState: {
        oneCA: true,
        source: "user",
        status: true,
      },
    };

    expect(extensionInfo).toEqual(expectedExtensionInfo);
  });
};