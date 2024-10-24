import { expect } from "expect";
import { findUrl, getDisplayedElement, getTabId, openNewTab } from "../utils/driver.js";
import { getOptionsHandle } from "../utils/hook.js";
import {
  addFiltersToAdBlock,
  blockHideUrl,
  checkBlockHidePage,
  initPopupPage,
} from "../utils/page.js";

export default () => {
  beforeEach(async function () {
    const { driver } = this;

    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToAdBlock(driver, "/pop_ads.js");
  });

  it("allowlists from popup", async function () {
    const { driver, origin } = this;

    // open new tab with the URL that will be allowlisted
    await openNewTab(driver, blockHideUrl);

    // ensure the page looks as it should before allowlisting
    await checkBlockHidePage(driver, { expectAllowlisted: false });

    // initialize the popup for the above page
    const tabId = await getTabId(driver, getOptionsHandle());
    await initPopupPage(driver, origin, tabId);

    // click on the 'Pause on this site' button
    const pauseButton = await getDisplayedElement(driver, "[data-text='domain_pause_adblock']");
    await pauseButton.click();

    // switch to the page
    await findUrl(driver, blockHideUrl);
    await driver.navigate().refresh();

    // check weather the allowlist filters were applied,
    // blocked elements should be displayed
    await checkBlockHidePage(driver, { expectAllowlisted: true });

    // re-open the popup and check if it's in allowlisted state
    await initPopupPage(driver, origin, tabId);

    // check if the allowlisted
    await getDisplayedElement(driver, "#div_domain_allowlisted_msg");
    const unpauseButton = await getDisplayedElement(driver, "[data-text='unpause_adblock']");
    await unpauseButton.click();

    // switch to the page
    await findUrl(driver, blockHideUrl);
    await driver.navigate().refresh();

    // the page should be back to the initial state
    await checkBlockHidePage(driver, { expectAllowlisted: false });
  });
};
