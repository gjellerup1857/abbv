/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
import { expect } from "expect";
import webdriver from "selenium-webdriver";

import { getOptionsHandle } from "../utils/hook.js";
import {
  getUserIdFromStorage,
  initOptionsPremiumTab,
  initOptionsThemesTab,
  initOptionsImageSwapTab,
  initOptionsBackupSyncTab,
  initOptionsPremiumFlTab,
  checkPremiumPageHeader,
} from "../utils/page.js";
import { getDisplayedElement, clickAndCloseNewTab, clickAndNavigateBack } from "../utils/driver.js";

export default () => {
  before(async function () {
    const { driver } = global;
    const userId = await getUserIdFromStorage(driver, getOptionsHandle());
    global.premiumURL = `https://getadblock.com/en/premium/?u=${userId}`;
  });

  it("displays cta and premium features", async function () {
    const { driver, extOrigin, premiumURL } = global;

    await initOptionsPremiumTab(driver, getOptionsHandle());
    await checkPremiumPageHeader("#locked-user-pay-section-mab > p", "#get-it-now-mab", premiumURL);

    const features = await driver.findElements(webdriver.By.css("#myadblock-features > div"));
    expect(features.length).toEqual(4);

    // click on each feature and check if it navigates to the correct premium page
    const hashes = ["#premium-filters", "#mab-image-swap", "#mab-themes", "#sync"];
    for (let i = 0; i < hashes.length; i++) {
      const selector = `#myadblock-features > div:nth-child(${i + 1})`;
      await clickAndNavigateBack(driver, selector, `${extOrigin}/options.html${hashes[i]}`);
    }
  });

  const selectors = [
    {
      selector: ".popup-menu-themes",
      expectedLockedThemeIds: [
        "solarized_theme",
        "solarized_light_theme",
        "watermelon_theme",
        "ocean_theme",
        "sunshine_theme",
      ],
    },
    {
      selector: ".options-page-themes",
      expectedLockedThemeIds: ["solarized_theme", "solarized_light_theme"],
    },
  ];
  for (const { selector, expectedLockedThemeIds } of selectors) {
    it(`shows ${selector} themes correctly`, async function () {
      const { driver, premiumURL } = global;

      await initOptionsThemesTab(driver, getOptionsHandle());
      await checkPremiumPageHeader(
        "#locked-user-pay-section-themes > p",
        "#get-it-now-themes",
        premiumURL,
      );

      const selectedTheme = await getDisplayedElement(driver, `${selector} .theme-box.selected`);
      expect(await selectedTheme.getAttribute("data-theme")).toEqual("default_theme");

      const lockedThemesElems = await driver.findElements(
        webdriver.By.css(`${selector} .theme-wrapper.locked .theme-box`),
      );

      const lockedThemesIds = await Promise.all(
        lockedThemesElems.map((e) => e.getAttribute("data-theme")),
      );

      expect(lockedThemesIds.sort()).toEqual(expectedLockedThemeIds.sort());

      for (const themeId of expectedLockedThemeIds) {
        await clickAndCloseNewTab(driver, `${selector} [data-theme="${themeId}"]`, premiumURL);
      }
    });
  }

  it("shows image swap off", async function () {
    const { driver, premiumURL } = global;
    await initOptionsImageSwapTab(driver, getOptionsHandle());

    await checkPremiumPageHeader(
      "#locked-user-pay-section-image-swap > p",
      "#get-it-now-image-swap",
      premiumURL,
    );

    const selectedOption = await getDisplayedElement(driver, "#channel-options .selected");
    expect(await selectedOption.getText()).toContain("Don't swap ads");

    const lockedOptions = await driver.findElements(webdriver.By.css("#channel-options .locked"));
    expect(lockedOptions.length).toEqual(8);

    // click on all locked options
    for (let i = 0; i < 8; i++) {
      await clickAndCloseNewTab(driver, `#channel-options > li:nth-child(${i + 2})`, premiumURL);
    }
  });

  it("shows backup & sync off", async function () {
    const { driver, premiumURL } = global;

    await initOptionsBackupSyncTab(driver, getOptionsHandle());
    await checkPremiumPageHeader(
      "#locked-user-pay-section-sync > p",
      "#get-it-now-sync",
      premiumURL,
    );

    const ctaLink = await getDisplayedElement(driver, "#get-sync");
    expect(await ctaLink.getText()).toEqual("Get Sync");

    await clickAndCloseNewTab(driver, "#get-sync", premiumURL);
  });

  it("shows premium filter lists locked in options page", async function () {
    const { driver, premiumURL } = global;

    await initOptionsPremiumFlTab(driver, getOptionsHandle());
    await checkPremiumPageHeader(
      "#locked-user-pay-section-distraction-control > p",
      "#get-it-now-distraction-control",
      premiumURL,
    );

    const lockedIcons = await driver.findElements(
      webdriver.By.css(".filter-subscription-wrapper .locked .premium_locked_icon"),
    );
    const iconsVisibility = await Promise.all(lockedIcons.map((i) => i.isDisplayed()));
    expect(iconsVisibility).toEqual([true, true]);

    const listTitlesElems = await driver.findElements(
      webdriver.By.css(".filter-subscription-wrapper .locked .premium_filter_list_title"),
    );

    const listTitles = await Promise.all(listTitlesElems.map((e) => e.getText()));
    expect(listTitles).toEqual(["Distraction Control", "Cookie Consent Cutter"]);

    // check distraction control link
    await clickAndCloseNewTab(driver, "#premium-filter-lists > div:nth-child(1)", premiumURL);
    // check cookie consent cutter link
    await clickAndCloseNewTab(driver, "#premium-filter-lists > div:nth-child(2)", premiumURL);
  });
};
