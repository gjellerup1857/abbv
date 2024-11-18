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
import { initOptionsGeneralTab, initPopupPage, sendExtMessage } from "../utils/page.js";
import { getOptionsHandle } from "../utils/hook.js";

const { By } = webdriver;

export default () => {
  it("activates premium", async function () {
    await initOptionsGeneralTab(getOptionsHandle());
    const premiumTab = await getDisplayedElement('[href="#mab"]');
    await premiumTab.click();
    const getItNowButton = await getDisplayedElement("#get-it-now-mab", 10000);
    await getItNowButton.click();

    const { url } = await findUrl("https://getadblock.com/en/premium");
    await driver.navigate().to(`${url}&testmode`);
    const getPremiumButton = await getDisplayedElement('[data-plan="me"]');
    await getPremiumButton.click();
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    await driver.sleep(1000); // Sometimes the scrolling is not done when the element is searched for
    const completePurchaseButton = await getDisplayedElement('[i18n="complete_purchase"]');
    await completePurchaseButton.click();

    try {
      await getDisplayedElement('[name="paddle_frame"]', 5000, false);
    } catch (e) {
      await completePurchaseButton.click(); // The complete purchase button is sometimes not clicked the first time
      await getDisplayedElement('[name="paddle_frame"]', 5000, false);
    }
    await driver.switchTo().frame("paddle_frame");
    const emailField = await getDisplayedElement(
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
      const zipField = await getDisplayedElement('[data-testid="postcodeInput"]', 5000, false);
      await zipField.click();
      await zipField.sendKeys("10115");
    } catch (e) {} // Depending on the location, the ZIP may be required or not
    const submitButton = await getDisplayedElement('[type="submit"]');
    await submitButton.click();

    const cardNumberField = await getDisplayedElement("#cardNumber", 5000, false);
    await cardNumberField.click();
    await cardNumberField.sendKeys("4242424242424242");
    const cardHolderField = await getDisplayedElement("#cardHolder");
    await cardHolderField.click();
    await cardHolderField.sendKeys("Test Automation");
    const expiryField = await getDisplayedElement("#expiry");
    await expiryField.click();
    await expiryField.sendKeys("0528");
    const cvvField = await getDisplayedElement("#cvv");
    await cvvField.click();
    await cvvField.sendKeys("295");
    const cardSubmitButton = await getDisplayedElement(
      '[data-testid="cardPaymentFormSubmitButton"]',
      20000,
      false,
    );
    await cardSubmitButton.click();
    await driver.switchTo().defaultContent();
    const getStartedButton = await getDisplayedElement('[i18n="get_started_cta"]', 20000, false);
    await getStartedButton.click();

    await driver.switchTo().window(getOptionsHandle());
    await driver.navigate().refresh();
    const premiumStatusText = await getDisplayedElement("#premium_status_msg", 4000);
    const options = { year: "numeric", month: "long" };
    const formattedDate = currentDate.toLocaleDateString("en-US", options).toUpperCase();
    expect(
      [`SUPPORTER SINCE ${formattedDate}`, "ACTIVE"].includes(await premiumStatusText.getText()),
    ).toEqual(true);
  });

  it("should have premium features", async function () {
    const timeout = 4000;

    await initOptionsGeneralTab(getOptionsHandle());
    await sendExtMessage({ type: "adblock:activate" });
    await driver.navigate().refresh();
    const premiumTab = await getDisplayedElement('[href="#mab"]');
    await premiumTab.click();
    await getDisplayedElement("#premium_status_msg", timeout);

    const imageSwapTab = await getDisplayedElement('[href="#mab-image-swap"]', timeout);
    await imageSwapTab.click();
    await getDisplayedElement("#cats", timeout);
    const themesTab = await getDisplayedElement('[href="#mab-themes"]', timeout);
    await themesTab.click();

    await getDisplayedElement('[data-key="options_page"][data-theme="dark_theme"]', timeout);
    const darkThemeOptionsPageItem = await driver.findElement(
      By.css('[data-key="options_page"][data-theme="dark_theme"] input'),
    );
    await darkThemeOptionsPageItem.click();
    const darkOptionsPage = await getDisplayedElement("#dark_theme", timeout);
    expect(await darkOptionsPage.isDisplayed()).toEqual(true);

    await getDisplayedElement('[data-key="popup_menu"][data-theme="dark_theme"]', timeout);
    const darkThemePopupItem = await driver.findElement(
      By.css('[data-key="popup_menu"][data-theme="dark_theme"] input'),
    );
    await darkThemePopupItem.click();
    await openNewTab("https://example.com/");
    const tabId = await getTabId(getOptionsHandle());
    await initPopupPage(tabId);
    const darkPopupPage = await getDisplayedElement("#dark_theme", timeout);
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
      const toggleElement = await getDisplayedElement(item.toggleSelector, timeout);
      expect(await toggleElement.isEnabled()).toEqual(true);
      expect(await toggleElement.getAttribute("data-is-checked")).toEqual(null);
      await toggleElement.click();
      const confirmButton = await getDisplayedElement(item.confirmButton, timeout);
      // A sliding animation can sometimes cause this to fail
      await driver.sleep(500);
      await confirmButton.click();
      // Opening the Options page first eliminates a flakiness issue on Edge
      await initOptionsGeneralTab(getOptionsHandle());
      await initPopupPage(tabId);
    }
    for (const item of toggleItems) {
      const toggleElement = await getDisplayedElement(item.toggleSelector, timeout);
      expect(await toggleElement.getAttribute("data-is-checked")).toEqual("true");
    }

    const url = "http://localhost:3005/dc-filters.html";
    await openNewTab(url);
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
      await waitForNotDisplayed(dcFilter);
    }
  });
};
