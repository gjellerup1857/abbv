/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const {
  beforeSequence, removeFilter
} = require("../../helpers");
const oneClickAllowlisting = require("./test-one-click-allowlisting.js");
const bypassAPI = require("./test-bypass-api.js");

describe("Public API", function()
{
  before(async function()
  {
    const {origin, extVersion} = await beforeSequence();
    this.test.parent.globalOrigin = origin;
    this.test.parent.extVersion = extVersion;
  });

  afterEach(async function()
  {
    await removeFilter("@@||adblockinc.gitlab.io^$document");
  });

  describe("Test one-click allowlisting", oneClickAllowlisting);
  describe("Test Bypass API", bypassAPI);
});
