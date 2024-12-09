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
  switchToABPOptionsTab,
  waitForNewWindow,
  addFiltersToABP,
  afterSequence
} = require("../../helpers");
const { expect } = require("chai");
const AdvancedPage = require("../../page-objects/advanced.page");
const AllowlistedWebsitesPage = require("../../page-objects/allowlistedWebsites.page");
const GeneralPage = require("../../page-objects/general.page");
const TestPages = require("../../page-objects/testPages.page");
const { AaTestPage } = require("../../page-objects/aa.test.page");
const testData = require("../../test-data/data-smoke-tests");

async function getTestpagesFilters() {
  const generalPage = new GeneralPage(browser);
  await browser.waitUntil(() => generalPage.isElementDisplayed("pre"));

  const filters = [];
  for (const filter of await $$("pre")) {
    filters.push(await filter.getText());
  }

  if (filters.length == 0) throw new Error("No filters were found on the page");

  return filters.join("\n");
}

function removeAllFiltersFromABP() {
  return browser.executeAsync(async (callback) => {
    const filters = await browser.runtime.sendMessage({ type: "filters.get" });
    await Promise.all(
      filters.map((filter) =>
        browser.runtime.sendMessage({
          type: "filters.remove",
          text: filter.text
        })
      )
    );

    callback();
  });
}

module.exports = function () {
  let aaCheckboxSelected;

  before(async function () {
    await afterSequence();

    const generalPage = new GeneralPage(browser);
    await generalPage.init();

    aaCheckboxSelected =
      await generalPage.isAllowAcceptableAdsCheckboxSelected();
  });

  after(async function () {
    await afterSequence();

    const generalPage = new GeneralPage(browser);
    await generalPage.init();

    const selected = await generalPage.isAllowAcceptableAdsCheckboxSelected();
    if (selected !== aaCheckboxSelected)
      await generalPage.clickAllowAcceptableAdsCheckbox();
  });

  it("blocks and hides ads", async function () {
    await waitForNewWindow(testData.blockHideUrl);

    const testPages = new TestPages(browser);
    await testPages.checkPage({ expectAllowlisted: false });
    await browser.closeWindow();
  });

  it("uses sitekey to allowlist content", async function () {
    const manifestVersion = process.env.MANIFEST_VERSION;
    const sitekeyUrl = `https://abptestpages.org/en/exceptions/sitekey_mv${manifestVersion}`;

    await waitForNewWindow(sitekeyUrl, 8000);
    const filters = await getTestpagesFilters();

    await switchToABPOptionsTab();
    await addFiltersToABP(filters);

    const generalPage = new GeneralPage(browser);
    await generalPage.switchToTab(sitekeyUrl, 8000);
    await browser.refresh();
    await browser.waitUntil(async () => {
      return (
        (await generalPage.isElementDisplayed("#sitekey-fail-1", false, 200)) ==
        false
      );
    });
    expect(await generalPage.isElementDisplayed("#sitekey-fail-2", false, 100))
      .to.be.false;
    expect(
      await generalPage.isElementDisplayed(
        "#sitekey-area > div.testcase-examplecontent"
      )
    ).to.be.true;

    await browser.switchToFrame(await $("#sitekey-frame"));
    expect(await generalPage.isElementDisplayed("#inframe-target")).to.be.true;
    if (manifestVersion === "3") {
      expect(await generalPage.isElementDisplayed("#inframe-image", false, 100))
        .to.be.false;
    } else {
      expect(await generalPage.isElementDisplayed("#inframe-image")).to.be.true;
    }

    await browser.closeWindow();

    await switchToABPOptionsTab();
    await removeAllFiltersFromABP();
  });

  it("displays acceptable ads", async function () {
    async function assertAcceptableAdsIsShown(shown) {
      const shortTimeout = 3000;
      const timeout = 10000;

      const testPage = new AaTestPage(browser);
      await testPage.init();
      await browser.waitUntil(
        async () => {
          await browser.refresh();
          return (
            (await testPage.isElementDisplayed(
              testPage.selector,
              shown,
              shortTimeout
            )) === false
          );
        },
        {
          timeout,
          timeoutMsg: `The AA element is still ${shown ? "not " : ""}shown in ${timeout}ms`
        }
      );

      expect(
        await testPage.isElementDisplayed(
          testPage.visibleSelector,
          false,
          shortTimeout
        )
      ).to.be.true;
    }
    const acceptableAdsIsOn = true;
    const generalPage = new GeneralPage(browser);

    expect(await generalPage.isAllowAcceptableAdsCheckboxSelected()).to.equal(
      acceptableAdsIsOn
    );

    await assertAcceptableAdsIsShown(acceptableAdsIsOn);

    // Switch AA
    await switchToABPOptionsTab({});
    await generalPage.clickAllowAcceptableAdsCheckbox();

    // Make sure the AA state has been changed due to click above
    expect(await generalPage.isAllowAcceptableAdsCheckboxSelected()).to.equal(
      !acceptableAdsIsOn
    );
    await assertAcceptableAdsIsShown(!acceptableAdsIsOn);
  });

  it("uses snippets to block ads", async function () {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "testpages.eyeo.com#$#hide-if-contains 'filter not applied' p[id]"
    );
    await advancedPage.clickAddCustomFilterListButton();
    await browser.newWindow(testData.snippetsPageUrl);
    const testPages = new TestPages(browser);
    await driver.sleep(30000);
    const timeout = 5000;
    await browser.waitUntil(
      async () => {
        return (await testPages.isSnippetFilterDivDisplayed()) == false;
      },
      { timeout, timeoutMsg: `snippet div still displayed after ${timeout}ms` }
    );
    expect(await testPages.isHiddenBySnippetTextDisplayed()).to.be.false;
    await browser.closeWindow();
  });

  it("allowlists websites", async function () {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.setAllowlistingTextboxValue(
      "http://testpages.eyeo.com/"
    );
    expect(await allowistedWebsitesPage.isAddWebsiteButtonEnabled()).to.be.true;
    await allowistedWebsitesPage.clickAddWebsiteButton();

    await waitForNewWindow(testData.blockHideUrl);

    const testPages = new TestPages(browser);
    await testPages.checkPage({ expectAllowlisted: true });

    await switchToABPOptionsTab();

    await allowistedWebsitesPage.removeAllowlistedDomain("testpages.eyeo.com");
    const attributesOfAllowlistingTableItems =
      await allowistedWebsitesPage.getAttributeOfAllowlistingTableItems(
        "class"
      );
    attributesOfAllowlistingTableItems.forEach(async (element) => {
      expect(element).to.equal("empty-placeholder");
    });

    await waitForNewWindow(testData.blockHideUrl);

    await testPages.checkPage({ expectAllowlisted: false });
    expect(await testPages.isSnippetFilterDivDisplayed()).to.be.false;
    expect(await testPages.isHiddenBySnippetTextDisplayed()).to.be.false;
  });
};
