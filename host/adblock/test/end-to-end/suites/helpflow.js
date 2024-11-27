import { expect } from "expect";
import { initPopupPage, addFiltersToAdBlock, blockHideUrl } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";
import {
  getDisplayedElement,
  openNewTab,
  getTabId,
  waitAndClickOnElement,
} from "../utils/driver.js";

// Utility function to initialize and open the Helpflow
async function initializeHelpflow() {
  const tabId = await getTabId(getOptionsHandle());
  await initPopupPage(tabId);
  await driver.navigate().refresh();
  const popupWindow = await driver.getWindowHandle();
  await driver.switchTo().window(popupWindow);
  return tabId;
}

async function clickHelpIcon() {
  await openNewTab(blockHideUrl);
  const tabId = await initializeHelpflow();
  await waitAndClickOnElement("#help_link", 3000);
  const currentURL = await driver.getCurrentUrl();
  const newUrl = `${currentURL}&tabId=${tabId}`;
  await driver.get(newUrl);
  expect(newUrl).toContain(`${tabId}`);
}

export default () => {
  it("initiates helpflow for first time ad", async function () {
    await clickHelpIcon();

    await waitAndClickOnElement("[i18n='see_ad']", 3000);
    await waitAndClickOnElement("[i18n='first_time_seeing_ad']", 3000);
    await waitAndClickOnElement(".button.help-button", 1000);
    await waitAndClickOnElement("[i18n='updating_filter_lists']");
    await waitAndClickOnElement("[i18n='reload_the_page']");
  });

  it("initiates helpflow for first time ad on allowlisted site", async function () {
    await addFiltersToAdBlock("@@localhost:3005$document");
    await clickHelpIcon();

    await waitAndClickOnElement("[i18n='see_ad']", 3000);
    await waitAndClickOnElement("[i18n='first_time_seeing_ad']", 3000);

    await waitAndClickOnElement(".button.help-button", 1000);
    await waitAndClickOnElement("[i18n='page_is_whitelisted']");
    const allowlistText = await getDisplayedElement("[i18n='page_is_whitelisted']");
    expect(await allowlistText.getText()).toContain(
      "This page is on your allowlist, which is why you're seeing an ad.",
    );
    await waitAndClickOnElement("[i18n='no']");
    await waitAndClickOnElement("[i18n-aria-label='back_help_flow']");
    await waitAndClickOnElement("[i18n='yes']");
  });

  it("initiates helpflow and removes allowlisted site from the allowlist", async function () {
    await addFiltersToAdBlock("@@localhost:3005$document");
    await clickHelpIcon();

    await waitAndClickOnElement("[i18n='see_ad']", 3000);
    await waitAndClickOnElement("[i18n='first_time_seeing_ad']", 3000);
    await waitAndClickOnElement(".button.help-button", 3000);
    await getDisplayedElement("[i18n='page_is_whitelisted']");
    await waitAndClickOnElement("[i18n='yes']");
    await waitAndClickOnElement("[i18n='reload_the_page']");
  });

  it("initiates helpflow for ads everywhere", async function () {
    await clickHelpIcon();

    await waitAndClickOnElement("[i18n='see_ad']", 5000);
    await waitAndClickOnElement("[i18n='see_ad_everywhere']", 3000);

    await waitAndClickOnElement("[i18n='learn_more_to_resolve']", 3000);
    const helpWindow = await driver.getWindowHandle();
    await driver.switchTo().window(helpWindow);
  });

  it("initiates helpflow for website is broken", async function () {
    await clickHelpIcon();

    await waitAndClickOnElement("[i18n='website_broken']", 5000);
    await getDisplayedElement("[i18n='reload_the_page']", 3000);
  });
};
