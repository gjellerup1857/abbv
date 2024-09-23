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

import { waitForNotNullAttribute, getDisplayedElement } from "../utils/driver.js";
import { initOptionsGeneralTab, initOptionsFiltersTab } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";

const { By } = webdriver;

export default () => {
  it("shows the built in language filter list dropdown", async function () {
    const { driver } = this;
    const expectedLanguages = [
      ["easylist_plus_arabic_plus_french", "Arabic + French + EasyList"],
      ["easylist_plus_bulgarian", "Bulgarian + EasyList"],
      ["chinese", "Chinese + EasyList"],
      ["czech", "Czech & Slovak + EasyList"],
      ["dutch", "Dutch + EasyList"],
      ["easylist_plus_french", "French + EasyList"],
      ["easylist_plus_german", "German + EasyList"],
      ["easylist_plus_global", "Global + EasyList"],
      ["israeli", "Hebrew + EasyList"],
      ["easylist_plus_hungarian", "Hungarian + EasyList"],
      ["easylist_plus_indian", "IndianList + EasyList"],
      ["easylist_plus_indonesian", "Indonesian + EasyList"],
      ["italian", "Italian + EasyList"],
      ["japanese", "Japanese"],
      ["easylist_plun_korean", "Korean"],
      ["latvian", "Latvian + EasyList"],
      ["easylist_plus_lithuania", "Lithuanian + EasyList"],
      ["nordic", "Nordic Filters + EasyList"],
      ["easylist_plus_polish", "Polish"],
      ["easylist_plus_portuguese", "Portuguese + EasyList"],
      ["easylist_plus_romanian", "Romanian + EasyList"],
      ["russian", "Russian & Ukrainian + EasyList"],
      ["easylist_plus_spanish", "Spanish"],
      ["turkish", "Turkish"],
      ["easylist_plus_vietnamese", "Vietnamese + EasyList"],
    ];

    await initOptionsFiltersTab(driver, getOptionsHandle());
    const dropdown = await getDisplayedElement(driver, "#language_select");

    const actualLanguages = [];
    for (const option of await dropdown.findElements(By.css("option"))) {
      const id = await option.getAttribute("value");
      if (!id) {
        continue;
      }

      const text = await option.getText();
      actualLanguages.push([id, text]);
    }

    expect(actualLanguages).toEqual(expectedLanguages);
  });
};
