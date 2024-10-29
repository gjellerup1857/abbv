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

import webdriver from "selenium-webdriver";

import { findUrl } from "../utils/driver.js";
import { initPopupPage } from "../utils/page.js";

const { By } = webdriver;

export default () => {
  it("opens the settings page", async function () {
    const { driver, origin } = this;

    // Open the Popup page
    await initPopupPage(driver, origin);
    const popupWindow = driver.getWindowHandle();

    // Close the existing options page
    await findUrl(driver, "options.html");
    await driver.close();

    // Click on the "gear" button
    await driver.switchTo().window(popupWindow);
    const gearButton = await driver.findElement(By.id("svg_options"));
    await gearButton.click();

    // Check that the Options page was opened
    await findUrl(driver, "options.html");
  });
};
