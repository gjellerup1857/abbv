import { expect } from "expect";
import {
  initPopupPage,
  addFiltersToAdBlock,
  blockHideUrl,
  initOptionsGeneralTab,
} from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";
import {
  getDisplayedElement,
  openNewTab,
  getTabId,
  waitAndClickOnElement,
} from "../utils/driver.js";

const seeAdSelector = "[i18n='see_ad']";

async function getLastDownloadTimestamp() {
  await initOptionsGeneralTab(getOptionsHandle());
  return driver.executeScript(() =>
    browser.runtime.sendMessage({ type: "subscriptions.get" }).then((result) => {
      // Access the first filterlist subscription in the array to get the lastDownload time
      const firstSubscription = result[0];
      const lastDownloadTimestamp = firstSubscription.lastDownload;
      return lastDownloadTimestamp;
    }),
  );
}

async function clickHelpIcon() {
  await openNewTab(blockHideUrl);
  const tabId = await getTabId(getOptionsHandle());

  await initPopupPage(tabId);
  await waitAndClickOnElement("#help_link", 3000);
  const currentURL = await driver.getCurrentUrl();
  const newUrl = `${currentURL}&tabId=${tabId}`;
  await driver.navigate().to(newUrl);
  // Ensure the right helpflow UI has effectively loaded
  await getDisplayedElement(seeAdSelector, 3000);
}

export default () => {
  it("initiates helpflow for first time ad", async function () {
    // Capture the last download timestamp before filterlists are updated
    const lastDownloadBeforeReload = await getLastDownloadTimestamp();
    await clickHelpIcon();
    await waitAndClickOnElement(seeAdSelector, 3000);
    await waitAndClickOnElement("[i18n='first_time_seeing_ad']", 3000);
    await waitAndClickOnElement(".button.help-button", 1000);
    await waitAndClickOnElement("[i18n='updating_filter_lists']");
    await waitAndClickOnElement("[i18n='reload_the_page']");
    await driver.sleep(3000);
    await initOptionsGeneralTab(getOptionsHandle());
    // Capture the last download timestamp after filterlists are updated
    const lastDownloadAfterReload = await getLastDownloadTimestamp();
    // Compare the lastDownload timestamps
    expect(lastDownloadAfterReload).not.toEqual(lastDownloadBeforeReload);
  });

  it("initiates helpflow for first time ad on allowlisted site", async function () {
    await addFiltersToAdBlock("@@localhost:3005$document");
    await clickHelpIcon();

    await waitAndClickOnElement(seeAdSelector, 3000);
    await waitAndClickOnElement("[i18n='first_time_seeing_ad']", 3000);

    await waitAndClickOnElement(".button.help-button", 1000);
    const allowlistText = await getDisplayedElement("[i18n='page_is_whitelisted']");
    expect(await allowlistText.getText()).toContain(
      "This page is on your allowlist, which is why you're seeing an ad.",
    );
    await allowlistText.click();
    await waitAndClickOnElement("[i18n='no']");
    await waitAndClickOnElement("[i18n-aria-label='back_help_flow']");
    await waitAndClickOnElement("[i18n='yes']");
  });

  it("initiates helpflow and removes allowlisted site from the allowlist", async function () {
    await addFiltersToAdBlock("@@localhost:3005$document");
    await clickHelpIcon();

    await waitAndClickOnElement(seeAdSelector, 3000);
    await waitAndClickOnElement("[i18n='first_time_seeing_ad']", 3000);
    await waitAndClickOnElement(".button.help-button", 3000);
    await getDisplayedElement("[i18n='page_is_whitelisted']");
    await waitAndClickOnElement("[i18n='yes']");
    await waitAndClickOnElement("[i18n='reload_the_page']");
  });

  it("initiates helpflow for ads everywhere", async function () {
    await clickHelpIcon();

    await waitAndClickOnElement(seeAdSelector, 5000);
    await waitAndClickOnElement("[i18n='see_ad_everywhere']", 3000);

    await waitAndClickOnElement("[i18n='learn_more_to_resolve']", 3000);
    const helpWindow = await driver.getWindowHandle();
    await driver.switchTo().window(helpWindow);
  });

  it("initiates helpflow for website is broken", async function () {
    await clickHelpIcon();

    await waitAndClickOnElement("[i18n='website_broken']", 5000);
    await waitAndClickOnElement("[i18n='reload_the_page']", 3000);
    await driver.sleep(3000);
    //check that AdBlock is disabld after page is reloaded
    await openNewTab(blockHideUrl);
    const tabId = await getTabId(getOptionsHandle());
    await initPopupPage(tabId);
    const pausedMessage = await getDisplayedElement("[id ='hostname']", 3000);
    expect(await pausedMessage.getText()).toContain("AdBlock is Paused");
  });
};
