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

import { expect } from "chai";

import AdvancedPage from "../page-objects/advanced.page.js";
import { defaultFilterLists } from "../test-data/data-built-in-filter-lists.js";

export default () => {
  let flNames;

  before(async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddBuiltinFilterListButton();
    flNames = [];
    for (const p of await advancedPage.getBuiltInFilterListsItemsNames()) {
      flNames.push(await p);
    }
  });

  defaultFilterLists.forEach(async (dataSet) => {
    it("should display filter list: " + dataSet.flName, async function () {
      if (dataSet.flName == "Snippets") {
        if (process.env.MANIFEST_VERSION === "3") {
          dataSet.flId =
            "ABP filters (compliance) " +
            "(ABP Anti-Circumvention Filter List)";
        }
      }
      if (dataSet.flStatus == "present") {
        expect(flNames).to.include(dataSet.flId);
      } else {
        expect(flNames).to.not.include(dataSet.flId);
      }
    });
  });
};
