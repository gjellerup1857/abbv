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
import { getTabId } from "../helpers.js";

import PopupPage from "../page-objects/popup.page.js";

let popupUrl;

export default () => {
  before(async function () {
    ({ popupUrl } = global);
  });

  it("should auto-allowlist YouTube", async function () {
    await browser.newWindow("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    const popupPage = new PopupPage(browser);
    await popupPage.switchToTab(/youtube/);
    const tabId = await getTabId({
      title:
        "Rick Astley - Never Gonna Give You" +
        " Up (Official Music Video) - YouTube"
    });

    await browser.executeScript(
      "const ytElement = document.createElement(" +
        "'ytd-enforcement-message-view-model');" +
        "document.body.appendChild(ytElement);",
      []
    );
    await browser.waitUntil(
      async () => {
        const readyState = await browser.executeScript(
          "return document.readyState",
          []
        );
        return readyState === "complete";
      },
      {
        timeout: 2000,
        timeoutMsg: "Page did not refresh within the expected time"
      }
    );

    await popupPage.init(popupUrl, tabId);
    await browser.waitUntil(
      async () => {
        return (await popupPage.isDomainToggleChecked()) == false;
      },
      {
        timeout: 5000,
        timeoutMsg: "Toggle was not unchecked within the expected time"
      }
    );
    expect(await popupPage.isDomainToggleChecked()).to.be.false;
  });
};
