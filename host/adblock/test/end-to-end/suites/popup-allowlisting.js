import { openNewTab } from "../utils/driver.js";
import {
  addFiltersToAdBlock,
  blockHideUrl,
  checkBlockHidePage,
  setPausedStateFromPopup,
} from "../utils/page.js";

export default () => {
  beforeEach(async function () {
    const { driver } = this;

    // This filter no longer exists in easylist
    // To be removed by https://eyeo.atlassian.net/browse/EXT-282
    await addFiltersToAdBlock(driver, "/pop_ads.js");
  });

  it("allowlists from popup", async function () {
    const { driver } = this;

    // open new tab with the URL that will be allowlisted
    const websiteHandle = await openNewTab(driver, blockHideUrl);

    // ensure the page looks as it should before allowlisting
    await checkBlockHidePage(driver, { expectAllowlisted: false });

    // pause adblock on the page
    await setPausedStateFromPopup(blockHideUrl, true);

    // switch to the page
    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();

    // check weather the allowlist filters were applied,
    // blocked elements should be displayed
    await checkBlockHidePage(driver, { expectAllowlisted: true });

    // unpause adblock on the page
    await setPausedStateFromPopup(blockHideUrl, false);

    // switch to the page
    await driver.switchTo().window(websiteHandle);
    await driver.navigate().refresh();

    // the page should be back to the initial state
    await checkBlockHidePage(driver, { expectAllowlisted: false });
  });
};
