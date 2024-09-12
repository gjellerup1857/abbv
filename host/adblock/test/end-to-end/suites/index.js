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

import { beforeEachTasks } from "../utils/hook.js";
import smoke from "./smoke.js";
import uninstall from "./uninstall.js";

export default () => {
  beforeEach(async function () {
    await beforeEachTasks(this.driver);
  });

  describe("Smoke Tests - Main", smoke);
  // Needs to be the last suite to run because the extension gets uninstalled
  describe("Smoke Tests - Uninstall", uninstall);
};
