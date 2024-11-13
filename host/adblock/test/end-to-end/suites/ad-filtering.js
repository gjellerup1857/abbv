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

import {
  getDisplayedElement,
  openNewTab,
  isCheckboxEnabled,
  waitForNotDisplayed,
} from "../utils/driver.js";
import {
  addFiltersToAdBlock,
  blockHideUrl,
  checkBlockHidePage,
  initOptionsCustomizeTab,
  setCustomFilters,
  initOptionsFiltersTab,
  clickFilterlist,
  setAADefaultState,
} from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";

const { By } = webdriver;

export default () => {
  after(async function () {
    const { driver, expectAAEnabled } = global;
    await setAADefaultState(driver, expectAAEnabled);
  });

  it("uses sitekey to allowlist content", async function () {
    const { driver, manifestVersion } = global;
    const url = `https://abptestpages.org/en/exceptions/sitekey_mv${manifestVersion}`;

    const getTestpagesFilters = async () => {
      await getDisplayedElement(driver, "pre");

      const filters = [];
      for (const elem of await driver.findElements(By.css("pre"))) {
        filters.push(await elem.getText());
      }

      if (filters.length === 0) {
        throw new Error(`No filters were found on ${url}`);
      }

      return filters.join("\n");
    };

    const removeAllFiltersFromAdBlock = async () => {
      return driver.executeAsyncScript(async (callback) => {
        const filters = await browser.runtime.sendMessage({ type: "filters.get" });
        await Promise.all(
          filters.map((filter) =>
            browser.runtime.sendMessage({ type: "filters.remove", text: filter.text }),
          ),
        );

        callback();
      });
    };

    const websiteHandle = await openNewTab(driver, url);
    // A failing element is displayed before applying the filters
    await getDisplayedElement(driver, "#sitekey-fail-1");

    const filters = await getTestpagesFilters();
    await driver.switchTo().window(getOptionsHandle());
    await addFiltersToAdBlock(driver, filters);

    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();
    // A failing element is no longer displayed after applying the filters
    await waitForNotDisplayed(driver, "#sitekey-fail-1");
    await waitForNotDisplayed(driver, "#sitekey-fail-2");
    await getDisplayedElement(driver, "#sitekey-area > div.testcase-examplecontent");

    await driver.switchTo().frame("sitekey-frame");
    await getDisplayedElement(driver, "#inframe-target");
    if (manifestVersion === 3) {
      await waitForNotDisplayed(driver, "#inframe-image");
    } else {
      await getDisplayedElement(driver, "#inframe-image");
    }

    await driver.switchTo().window(getOptionsHandle());
    await removeAllFiltersFromAdBlock();
  });

  it("blocks and hides ads", async function () {
    const { driver } = global;

    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToAdBlock(driver, "/pop_ads.js");

    await openNewTab(driver, blockHideUrl);
    await checkBlockHidePage(driver, { expectAllowlisted: false });
  });

  it("uses snippets to block ads", async function () {
    const { driver } = global;
    const filter = "adblockinc.gitlab.io#$#hide-if-contains 'should be hidden' p[id]";
    const url = "https://adblockinc.gitlab.io/QA-team/adblocking/snippets/snippets-testpage.html";

    const websiteHandle = await openNewTab(driver, url);
    const snippetElem = await getDisplayedElement(driver, "#snippet-filter");
    expect(await snippetElem.getText()).toEqual("This should be hidden by a snippet");

    await initOptionsCustomizeTab(driver, getOptionsHandle());
    await setCustomFilters([filter]);

    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();
    await waitForNotDisplayed(driver, "#snippet-filter", 2000);
  });

  it("allowlists websites", async function () {
    const { driver } = global;
    const filters = ["@@adblockinc.gitlab.io$document", "/pop_ads.js"];

    await initOptionsCustomizeTab(driver, getOptionsHandle());
    await setCustomFilters(filters);

    const websiteHandle = await openNewTab(driver, blockHideUrl);
    await checkBlockHidePage(driver, { expectAllowlisted: true });

    await initOptionsCustomizeTab(driver, getOptionsHandle());
    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await setCustomFilters(["/pop_ads.js"]);

    await driver.switchTo().window(websiteHandle);
    await checkBlockHidePage(driver, { expectAllowlisted: false });
    await waitForNotDisplayed(driver, "#snippet-filter");
  });

  it("displays acceptable ads", async function () {
    const { expectAAEnabled, driver } = global;
    const aaUrl = "http://testpages.adblockplus.org:3005/aa.html";
    const visibleSelector = "#abptest2";
    const hiddenSelector = "#abptest";
    const aaTimeout = 500;
    const aaFLButtonId = "adblockFilterList_0";

    await initOptionsFiltersTab(driver, getOptionsHandle());
    await driver.wait(
      // https://eyeo.atlassian.net/browse/EXT-446
      async () => {
        return (await isCheckboxEnabled(driver, aaFLButtonId)) === expectAAEnabled;
      },
      2000,
      `Acceptable Ads is not in the default state. Expected state: ${expectAAEnabled}`,
    );
    const websiteHandle = await openNewTab(driver, aaUrl);
    if (expectAAEnabled) {
      await getDisplayedElement(driver, hiddenSelector);
    } else {
      await waitForNotDisplayed(driver, hiddenSelector);
    }
    await getDisplayedElement(driver, visibleSelector);

    await initOptionsFiltersTab(driver, getOptionsHandle());
    await clickFilterlist(driver, "acceptable_ads", aaFLButtonId, !expectAAEnabled);
    await driver.switchTo().window(websiteHandle);
    await driver.wait(
      async () => {
        await driver.navigate().refresh();
        try {
          await getDisplayedElement(driver, visibleSelector, aaTimeout);
          if (!expectAAEnabled) {
            await getDisplayedElement(driver, hiddenSelector, aaTimeout);
          } else {
            await waitForNotDisplayed(driver, hiddenSelector, aaTimeout);
          }
          return true;
        } catch (e) {}
      },
      8000,
      "The AA element is still in unexpected state in 8000 ms",
    );
  });
};
