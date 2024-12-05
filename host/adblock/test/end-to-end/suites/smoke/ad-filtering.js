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
import { By } from "selenium-webdriver";

import {
  getDisplayedElement,
  openNewTab,
  isCheckboxEnabled,
  waitForNotDisplayed,
} from "../../utils/driver.js";
import {
  addFiltersToAdBlock,
  blockHideUrl,
  aaTestPageUrl,
  checkBlockHidePage,
  initOptionsCustomizeTab,
  setCustomFilters,
  initOptionsFiltersTab,
  clickFilterlist,
  setAADefaultState,
  allowlistingFilter,
  customBlockingFilters,
} from "../../utils/page.js";
import { getOptionsHandle } from "../../utils/hook.js";

export default () => {
  after(async function () {
    await setAADefaultState();
  });

  it("uses sitekey to allowlist content", async function () {
    const url = `https://abptestpages.org/en/exceptions/sitekey_mv${extension.manifestVersion}`;

    const getTestpagesFilters = async () => {
      await getDisplayedElement("pre");

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

    const websiteHandle = await openNewTab(url);
    // A failing element is displayed before applying the filters
    await getDisplayedElement("#sitekey-fail-1");

    const filters = await getTestpagesFilters();
    await driver.switchTo().window(getOptionsHandle());
    await addFiltersToAdBlock(filters);

    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();
    // A failing element is no longer displayed after applying the filters
    await waitForNotDisplayed("#sitekey-fail-1");
    await waitForNotDisplayed("#sitekey-fail-2");
    await getDisplayedElement("#sitekey-area > div.testcase-examplecontent");

    await driver.switchTo().frame("sitekey-frame");
    await getDisplayedElement("#inframe-target");
    if (extension.manifestVersion === 3) {
      await waitForNotDisplayed("#inframe-image");
    } else {
      await getDisplayedElement("#inframe-image");
    }

    await driver.switchTo().window(getOptionsHandle());
    await removeAllFiltersFromAdBlock();
  });

  it("blocks and hides ads", async function () {
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToAdBlock(customBlockingFilters.join("\n"));

    await openNewTab(blockHideUrl);
    await checkBlockHidePage(false);
  });

  it("uses snippets to block ads", async function () {
    const filter = "eyeo.gitlab.io#$#hide-if-contains 'should be hidden' p[id]";
    const url =
      "https://eyeo.gitlab.io/browser-extensions-and-premium/supplemental/QA-team/adblocking/snippets/snippets-testpage.html";

    const websiteHandle = await openNewTab(url);
    const snippetElem = await getDisplayedElement("#snippet-filter");
    expect(await snippetElem.getText()).toEqual("This should be hidden by a snippet");

    await initOptionsCustomizeTab(getOptionsHandle());
    await setCustomFilters([filter]);

    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();
    await waitForNotDisplayed("#snippet-filter", 2000);
  });

  it("allowlists websites", async function () {
    const allFilters = [...customBlockingFilters, allowlistingFilter];

    await initOptionsCustomizeTab(getOptionsHandle());
    await setCustomFilters(allFilters);

    const websiteHandle = await openNewTab(blockHideUrl);
    await checkBlockHidePage(true);

    await initOptionsCustomizeTab(getOptionsHandle());
    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await setCustomFilters(customBlockingFilters);

    await driver.switchTo().window(websiteHandle);
    await checkBlockHidePage(false);
    await waitForNotDisplayed("#snippet-filter");
  });

  it("displays acceptable ads", async function () {
    const visibleSelector = "#abptest2";
    const hiddenSelector = "#abptest";
    const aaFLButtonId = "adblockFilterList_0";
    const { expectAAEnabled } = browserDetails;

    await initOptionsFiltersTab(getOptionsHandle());
    await driver.wait(
      // https://eyeo.atlassian.net/browse/EXT-446
      async () => {
        return (await isCheckboxEnabled(aaFLButtonId)) === expectAAEnabled;
      },
      2000,
      `Acceptable Ads is not in the default state. Expected state: ${expectAAEnabled}`,
    );
    const websiteHandle = await openNewTab(aaTestPageUrl);
    if (browserDetails.expectAAEnabled) {
      await getDisplayedElement(hiddenSelector);
    } else {
      await waitForNotDisplayed(hiddenSelector);
    }
    await getDisplayedElement(visibleSelector);

    await initOptionsFiltersTab(getOptionsHandle());
    await clickFilterlist("acceptable_ads", aaFLButtonId, !expectAAEnabled);
    await driver.switchTo().window(websiteHandle);
    await driver.wait(
      async () => {
        await driver.navigate().refresh();
        try {
          await getDisplayedElement(visibleSelector);
          if (!expectAAEnabled) {
            await getDisplayedElement(hiddenSelector);
          } else {
            await waitForNotDisplayed(hiddenSelector, 500);
          }
          return true;
        } catch (e) {}
      },
      8000,
      "The AA element is still in unexpected state after 8000 ms",
    );
  });
};
