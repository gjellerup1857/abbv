/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2024-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

import { expect } from "expect";
import webdriver from "selenium-webdriver";

import {
  getDisplayedElement,
  findUrl,
  openNewTab,
  getTabId,
  randomIntFromInterval,
  waitForNotDisplayed,
} from "../utils/driver.js";
import { initOptionsGeneralTab, initPopupPage } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";

const { By } = webdriver;

export default () => {
  it("activates premium", async function () {
    const { driver } = this;

    await initOptionsGeneralTab(driver, getOptionsHandle());
    const premiumTab = await getDisplayedElement(driver, '[href="#mab"]');
    await premiumTab.click();
    const getItNowButton = await getDisplayedElement(driver, "#get-it-now-mab", 10000);
    await getItNowButton.click();

    const { url } = await findUrl(driver, "https://getadblock.com/en/premium");
    await driver.navigate().to(`${url}&testmode`);
    const getPremiumButton = await getDisplayedElement(driver, '[data-plan="me"]');
    await getPremiumButton.click();
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    await driver.sleep(1000); // Sometimes the scrolling is not done when the element is searched for
    const completePurchaseButton = await getDisplayedElement(driver, '[i18n="complete_purchase"]');
    await completePurchaseButton.click();

    try {
      await getDisplayedElement(driver, '[name="paddle_frame"]', 5000, false);
    } catch (e) {
      await completePurchaseButton.click(); // The complete purchase button is sometimes not clicked the first time
      await getDisplayedElement(driver, '[name="paddle_frame"]', 5000, false);
    }
    await driver.switchTo().frame("paddle_frame");
    const emailField = await getDisplayedElement(
      driver,
      '[data-testid="authenticationEmailInput"]',
      20000,
      false,
    );
    await emailField.click();
    const currentDate = new Date();
    const optionsYMD = { year: "numeric", month: "numeric", day: "numeric" };
    const formattedDateYMD = currentDate.toLocaleDateString("en-US", optionsYMD).replace(/\D/g, "");
    await emailField.sendKeys(
      `test_automation${formattedDateYMD}${randomIntFromInterval(1000000, 9999999).toString()}@adblock.org`,
    );
    try {
      const zipField = await getDisplayedElement(
        driver,
        '[data-testid="postcodeInput"]',
        5000,
        false,
      );
      await zipField.click();
      await zipField.sendKeys("10115");
    } catch (e) {} // Depending on the location, the ZIP may be required or not
    const submitButton = await getDisplayedElement(driver, '[type="submit"]');
    await submitButton.click();

    const cardNumberField = await getDisplayedElement(driver, "#cardNumber", 5000, false);
    await cardNumberField.click();
    await cardNumberField.sendKeys("4242424242424242");
    const cardHolderField = await getDisplayedElement(driver, "#cardHolder");
    await cardHolderField.click();
    await cardHolderField.sendKeys("Test Automation");
    const expiryField = await getDisplayedElement(driver, "#expiry");
    await expiryField.click();
    await expiryField.sendKeys("0528");
    const cvvField = await getDisplayedElement(driver, "#cvv");
    await cvvField.click();
    await cvvField.sendKeys("295");
    const cardSubmitButton = await getDisplayedElement(
      driver,
      '[data-testid="cardPaymentFormSubmitButton"]',
      20000,
      false,
    );
    await cardSubmitButton.click();
    await driver.switchTo().defaultContent();
    const getStartedButton = await getDisplayedElement(
      driver,
      '[i18n="get_started_cta"]',
      20000,
      false,
    );
    await getStartedButton.click();

    await driver.switchTo().window(getOptionsHandle());
    await driver.navigate().refresh();
    const premiumStatusText = await getDisplayedElement(driver, "#premium_status_msg", 4000);
    const options = { year: "numeric", month: "long" };
    const formattedDate = currentDate.toLocaleDateString("en-US", options).toUpperCase();
    expect(
      [`SUPPORTER SINCE ${formattedDate}`, "ACTIVE"].includes(await premiumStatusText.getText()),
    ).toEqual(true);
  });

  it("should have premium features", async function () {
    const { driver, popupUrl } = this;
    const defaultTimeout = 5000;

    await initOptionsGeneralTab(driver, getOptionsHandle());
    await driver.executeScript("License.activate()");
    await driver.navigate().refresh();
    const premiumTab = await getDisplayedElement(driver, '[href="#mab"]');
    await premiumTab.click();
    await getDisplayedElement(driver, "#premium_status_msg", defaultTimeout);
    await driver.navigate().refresh();

    const imageSwapTab = await getDisplayedElement(
      driver,
      '[href="#mab-image-swap"]',
      defaultTimeout,
    );
    await imageSwapTab.click();
    await getDisplayedElement(driver, "#cats", defaultTimeout);
    const themesTab = await getDisplayedElement(driver, '[href="#mab-themes"]', defaultTimeout);
    await themesTab.click();

    await getDisplayedElement(
      driver,
      '[data-key="options_page"][data-theme="dark_theme"]',
      defaultTimeout,
    );
    const darkThemeOptionsPageItem = await driver.findElement(
      By.css('[data-key="options_page"][data-theme="dark_theme"] input'),
    );
    await darkThemeOptionsPageItem.click();
    const darkOptionsPage = await getDisplayedElement(driver, "#dark_theme", defaultTimeout);
    expect(await darkOptionsPage.isDisplayed()).toEqual(true);

    await getDisplayedElement(
      driver,
      '[data-key="popup_menu"][data-theme="dark_theme"]',
      defaultTimeout,
    );
    const darkThemePopupItem = await driver.findElement(
      By.css('[data-key="popup_menu"][data-theme="dark_theme"] input'),
    );
    await darkThemePopupItem.click();
    await openNewTab(driver, "https://example.com/");
    const tabId = await getTabId(driver, getOptionsHandle());
    await initPopupPage(driver, popupUrl, tabId);
    const darkPopupPage = await getDisplayedElement(driver, "#dark_theme", defaultTimeout);
    expect(await darkPopupPage.isDisplayed()).toEqual(true);

    const toggleItems = [
      {
        toggleSelector: '[data-name="cookies-premium"]',
        confirmButton: '[data-action="confirmCookie"]',
      },
      {
        toggleSelector: '[data-name="distraction-control"]',
        confirmButton: '[data-action="confirmDistractions"]',
      },
    ];
    for (const item of toggleItems) {
      const toggleElement = await getDisplayedElement(driver, item.toggleSelector, defaultTimeout);
      expect(await toggleElement.isEnabled()).toEqual(true);
      expect(await toggleElement.getAttribute("data-is-checked")).toEqual(null);
    }
    for (const item of toggleItems) {
      const toggleElement = await getDisplayedElement(driver, item.toggleSelector, defaultTimeout);
      await toggleElement.click();
      const confirmButton = await getDisplayedElement(driver, item.confirmButton, defaultTimeout);
      await confirmButton.click();
      await initPopupPage(driver, popupUrl, tabId);
    }
    for (const item of toggleItems) {
      const toggleElement = await getDisplayedElement(driver, item.toggleSelector, defaultTimeout);
      expect(await toggleElement.getAttribute("data-is-checked")).toEqual("true");
    }

    const url =
      "https://adblockinc.gitlab.io/QA-team/adblocking/DC-filters/DC-filters-testpage.html";
    await openNewTab(driver, url);
    const dcFilters = [
      "#pushnotifications-hiding-filter",
      "#pushnotifications-blocking-filter",
      "#product-video-container",
      "#autoplayvideo-blocking-filter",
      "#survey-feedback-to-left",
      "#survey-blocking-filter",
      "#newsletterMsg",
      "#newsletter-blocking-filter",
    ];
    for (const dcFilter of dcFilters) {
      await waitForNotDisplayed(driver, dcFilter);
    }
  });
};
