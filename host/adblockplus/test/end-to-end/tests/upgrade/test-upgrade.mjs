/* eslint-disable no-console */

import {
  beforeSequence,
  isFirefox,
  switchToABPOptionsTab,
  waitForExtension
} from "../../helpers.js";

let prevExtVersion;

describe("Test upgrade scenario", function () {
  before(async function () {
    // Firefox does not support upgrading the extension, because,
    // it does not support loading unpacked extensions.
    // When switching to selenium-webdriver, we can use the same
    // approach as in Chromium
    if (isFirefox()) {
      this.skip();
    }

    ({ extVersion: prevExtVersion } = await beforeSequence());
  });

  it("should check something here", async function () {
    // Switch to the ABP options tab
    await switchToABPOptionsTab();

    // Upgrade the extension
    await browser.upgradeExtension();

    // get the new extension version
    const { extVersion } = await waitForExtension();
    console.log("Extension got upgraded!", {
      prevExtVersion,
      extVersion
    });
  });
});
