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

import { expect } from "chai";
import { sendExtCommand, updateExtPrefAPIKey } from "./shared/helpers.mjs";
import {
  addFilter,
  reloadExtension,
  waitForNewWindow,
  addFiltersToABP,
  isEdge,
  isFirefox
} from "../../helpers.js";
import testData from "../../test-data/data-smoke-tests.js";
import TestPages from "../../page-objects/testPages.page.js";

const { blockHideUrl } = testData;

export default function () {
  let extVersion;

  before(async function () {
    // https://eyeo.atlassian.net/browse/EXT-153
    if (isEdge()) this.skip();
    // https://eyeo.atlassian.net/browse/EXT-608
    if (isFirefox()) this.skip();

    await updateExtPrefAPIKey("bypass_authorizedKeys");
    await reloadExtension();
    ({ extVersion } = global);

    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToABP("/pop_ads.js");
  });

  it("returns adblocking is active extension info", async function () {
    // open the block-hide page
    await waitForNewWindow(blockHideUrl);

    // verify that the page is not allowlisted
    const testPages = new TestPages(browser);
    await testPages.checkPage({ expectAllowlisted: false });

    // send request extension info command
    const { extensionInfo } = await sendExtCommand({
      triggerEventName: "flattr-request-payload",
      responseEventName: "flattr-payload"
    });

    const expectedExtensionInfo = {
      name: "adblockplus",
      version: extVersion,
      allowlistState: {
        oneCA: true,
        source: null,
        status: false
      }
    };

    expect(extensionInfo).deep.equal(expectedExtensionInfo);
  });

  it("returns allowlisted page extension info", async function () {
    // open the block-hide page
    await waitForNewWindow(blockHideUrl);

    // ensure the page is initially not allowlisted
    const testPages = new TestPages(browser);
    await testPages.checkPage({ expectAllowlisted: false });

    // Allowlist the page
    await addFilter("@@||eyeo.gitlab.io^$document");

    // Check that the page was allowlisted
    await testPages.checkPage({ expectAllowlisted: true });

    // send request extension info command
    const { extensionInfo } = await sendExtCommand({
      triggerEventName: "flattr-request-payload",
      responseEventName: "flattr-payload"
    });

    const expectedExtensionInfo = {
      name: "adblockplus",
      version: extVersion,
      allowlistState: {
        oneCA: true,
        source: "user",
        status: true
      }
    };

    expect(extensionInfo).deep.equal(expectedExtensionInfo);
  });
}
