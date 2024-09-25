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

import { findUrl, getDisplayedElement, openNewTab, waitForNotDisplayed } from "../utils/driver.js";
import { initOptionsCustomizeTab, setCustomFilters } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";

const { By } = webdriver;

export default () => {
  const blockHideUrl =
    "https://adblockinc.gitlab.io/QA-team/adblocking/blocking-hiding/blocking-hiding-testpage.html";

  async function addFiltersToAdBlock(driver, filters) {
    const err = await driver.executeAsyncScript(async (filtersToAdd, callback) => {
      const errors = await browser.runtime.sendMessage({
        type: "filters.importRaw",
        text: filtersToAdd,
      });
      if (typeof errors !== "undefined" && errors[0]) {
        callback(errors[0]);
      }

      callback();
    }, filters);

    if (err) {
      throw new Error(err);
    }
  }

  it("uses sitekey to allowlist content", async function () {
    const { driver, manifestVersion } = this;
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

    await openNewTab(driver, url);
    // A failing element is displayed before applying the filters
    await getDisplayedElement(driver, "#sitekey-fail-1");

    const filters = await getTestpagesFilters();
    await driver.switchTo().window(getOptionsHandle());
    await addFiltersToAdBlock(driver, filters);

    await findUrl(driver, url);
    await driver.navigate().refresh();
    // A failing element is no longer displayed after applying the filters
    await waitForNotDisplayed(driver, "#sitekey-fail-1");
    await waitForNotDisplayed(driver, "#sitekey-fail-2");
    await getDisplayedElement(driver, "#sitekey-area > div.testcase-examplecontent");

    await driver.switchTo().frame("sitekey-frame");
    await getDisplayedElement(driver, "#inframe-target");
    if (manifestVersion == 3) {
      await waitForNotDisplayed(driver, "#inframe-image");
    } else {
      await getDisplayedElement(driver, "#inframe-image");
    }

    await driver.switchTo().window(getOptionsHandle());
    await removeAllFiltersFromAdBlock();
  });

  it("blocks and hides ads", async function () {
    const { driver } = this;

    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToAdBlock(driver, "/pop_ads.js");

    await openNewTab(driver, blockHideUrl);
    const popadsElem = await getDisplayedElement(driver, "#popads-blocking-filter");
    expect(await popadsElem.getText()).toEqual("pop_ads.js was blocked");
    const banneradsElem = await getDisplayedElement(driver, "#bannerads-blocking-filter");
    expect(await banneradsElem.getText()).toEqual("bannerads/* was blocked");

    await waitForNotDisplayed(driver, "#search-ad");
    await waitForNotDisplayed(driver, "#AdContainer");
  });

  it("uses snippets to block ads", async function () {
    const { driver } = this;
    const filter = "adblockinc.gitlab.io#$#hide-if-contains 'should be hidden' p[id]";
    const url = "https://adblockinc.gitlab.io/QA-team/adblocking/snippets/snippets-testpage.html";

    await openNewTab(driver, url);
    const snippetElem = await getDisplayedElement(driver, "#snippet-filter");
    expect(await snippetElem.getText()).toEqual("This should be hidden by a snippet");

    await initOptionsCustomizeTab(driver, getOptionsHandle());
    await setCustomFilters(driver, [filter]);

    await findUrl(driver, url);
    await driver.navigate().refresh();
    await waitForNotDisplayed(driver, "#snippet-filter");
  });

  it("allowlists websites", async function () {
    const { driver } = this;
    const filters = ["@@adblockinc.gitlab.io$document", "/pop_ads.js"];

    await initOptionsCustomizeTab(driver, getOptionsHandle());
    await setCustomFilters(driver, filters);

    await openNewTab(driver, blockHideUrl);
    await driver.wait(
      async () => {
        const popadsElem = await getDisplayedElement(driver, "#popads-blocking-filter");
        const banneradsElem = await getDisplayedElement(driver, "#bannerads-blocking-filter");
        try {
          expect(await popadsElem.getText()).toEqual(
            "pop_ads.js blocking filter should block this",
          );
          expect(await banneradsElem.getText()).toEqual(
            "first bannerads/* blocking filter should block this",
          );
          return true;
        } catch (e) {
          await driver.navigate().refresh();
        }
      },
      5000,
      "allowlisting filters were not applied",
    );
    const searchAdElem = await getDisplayedElement(driver, "#search-ad");
    expect(await searchAdElem.getText()).toEqual("search-ad id hiding filter should hide this");
    const adContainerElem = await getDisplayedElement(driver, "#AdContainer");
    expect(await adContainerElem.getText()).toEqual(
      "AdContainer class hiding filter should hide this",
    );

    await initOptionsCustomizeTab(driver, getOptionsHandle());
    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await setCustomFilters(driver, ["/pop_ads.js"]);

    await findUrl(driver, blockHideUrl);
    await driver.wait(
      async () => {
        const popadsElem = await getDisplayedElement(driver, "#popads-blocking-filter");
        const banneradsElem = await getDisplayedElement(driver, "#bannerads-blocking-filter");
        try {
          expect(await popadsElem.getText()).toEqual("pop_ads.js was blocked");
          expect(await banneradsElem.getText()).toEqual("bannerads/* was blocked");
          return true;
        } catch (e) {
          await driver.navigate().refresh();
        }
      },
      5000,
      "blocking filters were not applied",
    );
    await waitForNotDisplayed(driver, "#snippet-filter");
  });

  it("displays acceptable ads", function () {
    // https://eyeo.atlassian.net/browse/EXT-71
    this.skip();
  });
};
