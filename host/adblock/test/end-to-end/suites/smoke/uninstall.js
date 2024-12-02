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

import { findUrl } from "../../utils/driver.js";
import { getUserIdFromInstallPage, initOptionsGeneralTab } from "../../utils/page.js";
import { getOptionsHandle } from "../../utils/hook.js";

export default () => {
  it("uninstalls the extension", async function () {
    const userId = await getUserIdFromInstallPage();
    const expectedParams = {
      u: userId,
      bc: expect.any(Number),
      lt: expect.any(Number),
      t: expect.any(Number),
      wafc: "0",
      p_s: expect.any(Number),
      aa_a: expect.any(Number),
    };

    await initOptionsGeneralTab(getOptionsHandle());

    await driver.executeScript(() => {
      browser.management.uninstallSelf();
    });

    const { url } = await findUrl("getadblock.com/en/uninstall");

    const params = new URLSearchParams(new URL(url).search);
    const actualParams = Object.fromEntries(params);
    actualParams.bc = parseInt(actualParams.bc, 10);
    actualParams.lt = parseInt(actualParams.lt, 10);
    actualParams.t = parseInt(actualParams.t, 10);
    actualParams.p_s = parseInt(actualParams.p_s, 10);
    actualParams.aa_a = parseInt(actualParams.aa_a, 10);

    expect(actualParams).toEqual(expect.objectContaining(expectedParams));
    const URL_BOOLEANS = [1, 0];
    expect(URL_BOOLEANS.includes(actualParams.aa_a)).toEqual(true);
    expect(URL_BOOLEANS.includes(actualParams.p_s)).toEqual(true);
  });
};
