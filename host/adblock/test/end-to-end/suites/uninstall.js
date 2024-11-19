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

import { findUrl } from "../utils/driver.js";
import { getUserIdFromPage } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";

export default () => {
  it("uninstalls the extension", async function () {
    const { driver } = global;

    const userId = await getUserIdFromPage(driver);
    const expectedParams = {
      u: userId,
      bc: expect.any(Number),
      lt: expect.any(Number),
      t: expect.any(Number),
      wafc: "0",
    };

    await driver.switchTo().window(getOptionsHandle());
    // To be replaced with waiting until testing.getReadyState == "started"
    // after https://eyeo.atlassian.net/browse/EE-568 gets fixed
    await driver.sleep(2000);

    await driver.executeScript(() => {
      browser.management.uninstallSelf();
    });

    const { url } = await findUrl(driver, "getadblock.com/en/uninstall");

    const params = new URLSearchParams(new URL(url).search);
    const actualParams = Object.fromEntries(params);
    actualParams.bc = parseInt(actualParams.bc, 10);
    actualParams.lt = parseInt(actualParams.lt, 10);
    actualParams.t = parseInt(actualParams.t, 10);

    expect(actualParams).toEqual(expect.objectContaining(expectedParams));
  });
};