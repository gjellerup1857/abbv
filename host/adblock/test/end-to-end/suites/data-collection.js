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

import { initOptionsGeneralTab } from "../utils/page.js";
import { isCheckboxEnabled, waitForNotDisplayed } from "../utils/driver.js";
import { getOptionsHandle } from "../utils/hook.js";

export default () => {
  it("no data collection for firefox", async function () {
    const { driver, browserName } = this;

    if (browserName !== "firefox") {
      this.skip();
    }

    await initOptionsGeneralTab(driver, getOptionsHandle());
    await driver.wait(
      async () => {
        const dataCollectionOptOut = await isCheckboxEnabled(
          driver,
          "prefs__data_collection_opt_out",
        );
        return dataCollectionOptOut;
      },
      2000,
      "prefs__data_collection_opt_out is not present or enabled",
    );
    await waitForNotDisplayed(driver, "//label[@for='enable_data_collection_v2']");
    await waitForNotDisplayed(driver, "//label[@for='prefs__send_ad_wall_messages']");
    await waitForNotDisplayed(driver, "//label[@for='enable_onpageMessages']");
  });
};
