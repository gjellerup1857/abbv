import webdriver from "selenium-webdriver";

import { findUrl, openNewTab } from "../utils/driver.js";
import {
  addFiltersToAdBlock,
  blockHideUrl,
  checkBlockHidePage,
  setPausedStateFromPopup,
  initPopupPage,
} from "../utils/page.js";

const { By } = webdriver;

export default () => {
  beforeEach(async function () {
    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToAdBlock("/pop_ads.js");
  });

  it("opens the settings page", async function () {
    // Open the Popup page
    await initPopupPage();
    const popupWindow = driver.getWindowHandle();

    // Close the existing options page
    await findUrl("options.html");
    await driver.close();

    // Click on the "gear" button
    await driver.switchTo().window(popupWindow);
    const gearButton = await driver.findElement(By.id("svg_options"));
    await gearButton.click();

    // Check that the Options page was opened
    await findUrl("options.html");
  });

  it("allowlists from popup", async function () {
    // open new tab with the URL that will be allowlisted
    const websiteHandle = await openNewTab(blockHideUrl);

    // ensure the page looks as it should before allowlisting
    await checkBlockHidePage(false);

    // pause adblock on the page
    await setPausedStateFromPopup(blockHideUrl, true);

    // switch to the page
    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();

    // check weather the allowlist filters were applied,
    // blocked elements should be displayed
    await checkBlockHidePage(true);

    // unpause adblock on the page
    await setPausedStateFromPopup(blockHideUrl, false);

    // switch to the page
    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();

    // the page should be back to the initial state
    await checkBlockHidePage(false);
  });
};
