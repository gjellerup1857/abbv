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

import { findUrl } from "@eyeo/test-utils/driver";
import { uninstallExtension } from "@eyeo/test-utils/extension";

import { getUserIdFromInstallPage, initOptionsGeneralTab } from "../../utils/page.js";
import { uninstallUrl } from "../../utils/urls.js";

export default () => {
  it("uninstalls the extension", async function () {
    const userId = await getUserIdFromInstallPage();
    const expectedParams = {
      u: userId,
      bc: expect.any(Number),
      lt: expect.any(Number),
      t: expect.any(Number),
      wafc: "0", // always 0 as we don't do that anymore
      aa: expect.stringMatching(/(u|0|1|2)/),
      ps: expect.stringMatching(/(0|1)/),
      er: expect.stringMatching(/^[a-zA-Z0-9]{8}/), // experiments revision ID. Example: ietbCO3H
      ev: expect.stringMatching(/^[a-zA-Z0-9+/]+=*/), // experiments variants. Example: AQ%3D%3
    };

    await uninstallExtension(initOptionsGeneralTab);
    const { url } = await findUrl(uninstallUrl);

    const params = new URLSearchParams(new URL(url).search);
    const actualParams = Object.fromEntries(params);
    actualParams.bc = parseInt(actualParams.bc, 10);
    actualParams.lt = parseInt(actualParams.lt, 10);
    actualParams.t = parseInt(actualParams.t, 10);

    expect(actualParams).toEqual(expectedParams);
  });
};
