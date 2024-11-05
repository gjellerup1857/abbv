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
import { reloadExtension, waitForNewWindow, isEdge } from "../../helpers.js";
import { updateExtPrefAPIKey, sendExtCommand } from "./shared/helpers.mjs";
import testData from "../../test-data/data-smoke-tests.js";
import TestPages from "../../page-objects/testPages.page.js";

const { blockHideUrl } = testData;

export default function () {
  before(async function () {
    // https://eyeo.atlassian.net/browse/EXT-153
    if (isEdge())
      this.skip();

    // update the authorized keys and reload extension
    await updateExtPrefAPIKey("allowlisting_authorizedKeys");
    await reloadExtension();
  });

  it("allowlists the page forever", async function () {
    // open the block-hide page
    await waitForNewWindow(blockHideUrl);

    // trigger allowlisting with expiration
    const allowlistedEvent = await sendExtCommand({
      triggerEventName: "domain_allowlisting_request",
      responseEventName: "domain_allowlisting_success"
    });

    // verify that the page received the allowlisting successfully event
    expect(allowlistedEvent).to.not.be.null;

    // refresh the page to ensure the allowlisting is applied
    await browser.refresh();

    // verify that the page is allowlisted
    const testPages = new TestPages(browser);
    await testPages.checkPage({ expectAllowlisted: true });
  });

  it("allowlists the page with expiration", async function () {
    // open the block-hide page
    await waitForNewWindow(blockHideUrl);

    // trigger allowlisting with expiration
    const allowlistedEvent = await sendExtCommand({
      triggerEventName: "domain_allowlisting_request",
      responseEventName: "domain_allowlisting_success",
      options: {
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
      }
    });

    // verify that the page received the allowlisting successfully event
    expect(allowlistedEvent).to.not.be.null;

    // refresh the page to ensure the allowlisting is applied
    await browser.refresh();

    // verify that the page is allowlisted
    const testPages = new TestPages(browser);
    await testPages.checkPage({ expectAllowlisted: true });
  });
}
