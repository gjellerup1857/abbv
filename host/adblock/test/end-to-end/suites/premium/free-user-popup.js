/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
import { expect } from "expect";

import { getDisplayedElement, getTabId, openNewTab, findUrl } from "@eyeo/test-utils/driver";
import { localTestPageUrl } from "@eyeo/test-utils/urls";

import { getOptionsHandle } from "@eyeo/test-utils/extension";
import { getUserIdFromStorage, initPopupPage } from "../../utils/page.js";
import { premiumUrl } from "../../utils/urls.js";

export default () => {
  const premiumFeatures = [
    { selector: '[data-name="cookieWalls"]', title: "Skip Cookie Walls" },
    { selector: '[data-name="blockDistractions"]', title: "Block Distractions" },
  ];

  let fullPremiumUrl;

  before(async function () {
    const userId = await getUserIdFromStorage(getOptionsHandle());
    fullPremiumUrl = `${premiumUrl}/?u=${userId}`;
  });

  beforeEach(async function () {
    await openNewTab(localTestPageUrl);
    const tabId = await getTabId(getOptionsHandle());
    await initPopupPage(tabId);
  });

  for (const { selector, title } of premiumFeatures) {
    it(`shows '${title}' as locked`, async function () {
      const titleElem = await getDisplayedElement(`${selector} .title`, { forceRefresh: false });
      expect(await titleElem.getText()).toEqual(title);

      const learnMoreBtn = await getDisplayedElement(`${selector} button`);
      expect(await learnMoreBtn.getText()).toEqual("Learn More");

      // click will close current tab and opens a new one
      await learnMoreBtn.click();

      // find new opened tab
      await findUrl(fullPremiumUrl);
    });
  }
};
