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
      ps: expect.any(Number),
      aa: expect.any(String),
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
    actualParams.ps = parseInt(actualParams.ps, 10);
    actualParams.aa = actualParams.aa;

    expect(actualParams).toEqual(expect.objectContaining(expectedParams));
    expect(["u", "0", "1", "2"].includes(actualParams.aa)).toEqual(true);
    expect([1, 0].includes(actualParams.ps)).toEqual(true);
    expect(/^[a-z0-9]{8}$/i.test(actualParams.er)).toEqual(true);
    expect(/^[a-z0-9+/]+=*$/i.test(actualParams.ev)).toEqual(true);
  });
};
