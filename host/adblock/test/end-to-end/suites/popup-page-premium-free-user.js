/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
import { expect } from "expect";

import { getOptionsHandle } from "../utils/hook.js";
import { getUserIdFromStorage, initPopupPage } from "../utils/page.js";
import { getDisplayedElement, getTabId, openNewTab, findUrl } from "../utils/driver.js";

export default () => {
  const premiumFeatures = [
    { selector: '[data-name="cookieWalls"]', title: "Skip Cookie Walls" },
    { selector: '[data-name="blockDistractions"]', title: "Block Distractions" },
  ];

  before(async function () {
    const { driver } = global;
    const userId = await getUserIdFromStorage(driver, getOptionsHandle());
    global.premiumURL = `https://getadblock.com/en/premium/?u=${userId}`;
  });

  beforeEach(async function () {
    const { driver, popupUrl } = global;
    await openNewTab(driver, "https://example.com/");
    const tabId = await getTabId(driver, getOptionsHandle());
    await initPopupPage(driver, popupUrl, tabId);
  });

  for (const { selector, title } of premiumFeatures) {
    it(`shows '${title}' as locked`, async function () {
      const { driver, premiumURL } = global;

      const titleElem = await getDisplayedElement(driver, `${selector} .title`);
      expect(await titleElem.getText()).toEqual(title);

      const learnMoreBtn = await getDisplayedElement(driver, `${selector} button`);
      expect(await learnMoreBtn.getText()).toEqual("Learn More");

      // click will close current tab and opens a new one
      await learnMoreBtn.click();

      // find new opened tab
      await findUrl(driver, premiumURL);
      const currentURL = await driver.getCurrentUrl();
      expect(currentURL).toEqual(premiumURL);
    });
  }
};
