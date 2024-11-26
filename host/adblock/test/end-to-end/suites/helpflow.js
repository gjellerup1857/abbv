import { initPopupPage, addFiltersToAdBlock } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";
import { getDisplayedElement, openNewTab, getTabId } from "../utils/driver.js";

// Utility function to initialize and open the Helpflow
async function initializeHelpflow(driver, url) {
  const tabId = await getTabId(getOptionsHandle());
  await initPopupPage(tabId);
  await driver.navigate().refresh();
  const popupWindow = await driver.getWindowHandle();
  await driver.switchTo().window(popupWindow);
  return tabId;
}

// Utility function to handle Helpflow navigation
async function navigateHelpflow(driver, currentURL, tabId) {
  // It's necessary to re-append the tabID to the currentURL because the tabID gets removed after clicking the help button
  const newUrl = `${currentURL}&tabId=${tabId}`;
  await driver.get(newUrl);
}

export default () => {
  const TEST_URL =
    "https://eyeo.gitlab.io/browser-extensions-and-premium/supplemental/QA-team/adblocking/blocking-hiding/blocking-hiding-testpage.html";

  it("initiates helpflow for first time ad", async function () {
    await openNewTab(TEST_URL);
    const tabId = await initializeHelpflow(driver, TEST_URL);
    const helpButton = await getDisplayedElement("#help_link", 3000);
    await helpButton.click();
    const currentURL = await driver.getCurrentUrl();
    await navigateHelpflow(driver, currentURL, tabId);

    const seeAd = await getDisplayedElement("[i18n='see_ad']", 3000);
    await seeAd.click();
    const firstTimeSeeAd = await getDisplayedElement("[i18n='first_time_seeing_ad']", 3000);
    await firstTimeSeeAd.click();
    const okButton = await getDisplayedElement(".button.help-button", 1000);
    await okButton.click();
    await getDisplayedElement("[i18n='updating_filter_lists']");
    const reloadButton = await getDisplayedElement("[i18n='reload_the_page']");
    await reloadButton.click();
  });

  it("initiates helpflow for first time ad on allowlisted site", async function () {
    await addFiltersToAdBlock("@@eyeo.gitlab.io$document");
    await openNewTab(TEST_URL);
    const tabId = await initializeHelpflow(driver, TEST_URL);

    const helpButton = await getDisplayedElement("#help_link", 3000);
    await helpButton.click();
    const currentURL = await driver.getCurrentUrl();
    await navigateHelpflow(driver, currentURL, tabId);

    const seeAd = await getDisplayedElement("[i18n='see_ad']", 3000);
    await seeAd.click();
    const firstTimeSeeAd = await getDisplayedElement("[i18n='first_time_seeing_ad']", 3000);
    await firstTimeSeeAd.click();
    const ok1Button = await getDisplayedElement(".button.help-button", 1000);
    await ok1Button.click();
    await getDisplayedElement("[i18n='page_is_whitelisted']");
    const noButton = await getDisplayedElement("[i18n='no']");
    await noButton.click();
    const ok2Button = await getDisplayedElement("[i18n='ok']");
    await ok2Button.click();
  });

  it("initiates helpflow and removes allowlisted site from the allowlist", async function () {
    await addFiltersToAdBlock("@@eyeo.gitlab.io$document");
    await openNewTab(TEST_URL);
    const tabId = await initializeHelpflow(driver, TEST_URL);

    const helpButton = await getDisplayedElement("#help_link", 3000);
    await helpButton.click();
    const currentURL = await driver.getCurrentUrl();
    await navigateHelpflow(driver, currentURL, tabId);

    const seeAd = await getDisplayedElement("[i18n='see_ad']", 3000);
    await seeAd.click();
    const firstTimeSeeAd = await getDisplayedElement("[i18n='first_time_seeing_ad']", 3000);
    await firstTimeSeeAd.click();
    const ok1Button = await getDisplayedElement(".button.help-button", 3000);
    await ok1Button.click();
    await getDisplayedElement("[i18n='page_is_whitelisted']");
    const yesButton = await getDisplayedElement("[i18n='yes']");
    await yesButton.click();
    const ok2Button = await getDisplayedElement("[i18n='reload_the_page']");
    await ok2Button.click();
  });

  it("initiates helpflow for ads everywhere", async function () {
    await openNewTab(TEST_URL);
    const tabId = await initializeHelpflow(driver, TEST_URL);

    const helpButton = await getDisplayedElement("#help_link", 3000);
    await helpButton.click();
    const currentURL = await driver.getCurrentUrl();
    await navigateHelpflow(driver, currentURL, tabId);

    const seeAd = await getDisplayedElement("[i18n='see_ad']", 3000);
    await seeAd.click();
    const seeAdEverywhere = await getDisplayedElement("[i18n='see_ad_everywhere']", 3000);
    await seeAdEverywhere.click();
    const learnMore = await getDisplayedElement("[i18n='learn_more_to_resolve']", 3000);
    await learnMore.click();
    const helpWindow = await driver.getWindowHandle();
    await driver.switchTo().window(helpWindow);
  });

  it("initiates helpflow for website is broken", async function () {
    await openNewTab(TEST_URL);
    const tabId = await initializeHelpflow(driver, TEST_URL);

    const helpButton = await getDisplayedElement("#help_link", 3000);
    await helpButton.click();
    const currentURL = await driver.getCurrentUrl();
    await navigateHelpflow(driver, currentURL, tabId);

    const websiteBroken = await getDisplayedElement("[i18n='website_broken']", 3000);
    await websiteBroken.click();
    await getDisplayedElement("[i18n='reload_the_page']", 3000);
  });
};
