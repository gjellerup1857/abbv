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
import webdriver from "selenium-webdriver";

import { openNewTab } from "../utils/driver.js";

const { By } = webdriver;

export default () => {
  it("loads a test server page", async function () {
    const { driver } = global;
    const url = "http://localhost:3005/test.html";

    await openNewTab(driver, url);
    const elem = await driver.findElement(By.css("h1"));
    expect(await elem.getText()).toEqual("Hello from host pages");
  });
};
