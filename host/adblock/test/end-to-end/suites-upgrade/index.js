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

/* eslint-disable no-console */
import { upgradeExtension } from "../runners/helpers.js";
import { beforeEachTasks } from "../utils/hook.js";

export default () => {
  describe("My awesome upgrade", function () {
    beforeEach(async function () {
      const { driver, extOrigin } = global;
      await beforeEachTasks(driver, extOrigin);
    });

    it("expect to have upgraded the extension", async function () {
      // get the extension version before the upgrade
      const prevExtVersion = global.extVersion;

      // do the upgrade
      await upgradeExtension();

      const { extVersion } = global;
      console.log("Extension versions after upgrade", {
        prevExtVersion,
        extVersion,
      });
    });
  });
};
