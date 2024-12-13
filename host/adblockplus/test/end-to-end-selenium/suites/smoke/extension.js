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

import { findUrl } from "@eyeo/test-utils/driver";
import { getOptionsHandle } from "@eyeo/test-utils/extension";
import { installUrl, checkInstallUninstallUrl } from "../../utils/page.js";

export default () => {
  it("opens the install url", async function () {
    const { url } = await findUrl(installUrl, 10000);

    await driver.switchTo().window(getOptionsHandle());
    const appVersion = await driver.executeScript(() => {
      return browser.runtime.getManifest().version;
    });

    await checkInstallUninstallUrl(url, appVersion);
  });
};
