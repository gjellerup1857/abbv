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
import { initOptionsGeneralTab } from "../utils/page.js";
import { isCheckboxEnabled, waitForNotDisplayed } from "../utils/driver.js";
import { getOptionsHandle } from "../utils/hook.js";

export default () => {
  it("does not collect data for Firefox", async function () {
    if (browserDetails.browserName !== "firefox") {
      this.skip();
    }

    await initOptionsGeneralTab(getOptionsHandle());
    const dataCollectionOptOut = await isCheckboxEnabled("prefs__data_collection_opt_out");
    expect(dataCollectionOptOut).toEqual(true);
    await waitForNotDisplayed("//label[@for='enable_data_collection_v2']");
    await waitForNotDisplayed("//label[@for='prefs__send_ad_wall_messages']");
    await waitForNotDisplayed("//label[@for='enable_onpageMessages']");
    await waitForNotDisplayed("//label[@for='enable_onpageMessages']");

    const optOutFlag = await driver.executeScript(() =>
      browser.runtime.sendMessage({
        type: "prefs.get",
        key: "data_collection_opt_out",
      }),
    );

    if (!optOutFlag) {
      throw new Error("No data_collection_opt_out prefs set to false in browser");
    }

    return optOutFlag;
  });
};
