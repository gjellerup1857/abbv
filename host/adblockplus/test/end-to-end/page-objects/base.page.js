/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

class BasePage {
  constructor(browser) {
    this.browser = browser;
  }

  get contentIFrame() {
    return $("#content");
  }

  async mockServerUpText(text) {
    return $("body[contains(text(),'" + text + "')]");
  }

  get truckerIFrame() {
    return $("#slave-2-1");
  }

  async getCurrentUrl() {
    return await browser.getUrl();
  }

  async getCurrentTitle() {
    return await browser.getTitle();
  }

  async getElementBySelector(selector) {
    return $(selector);
  }

  async isElementDisplayed(selector, reverseOption = false, timeout = 10000) {
    return await this.waitForDisplayedNoError(
      this.getElementBySelector(selector),
      reverseOption,
      timeout
    );
  }

  async isMockServerUpTextDisplayed(serverUpText, reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.mockServerUpText(serverUpText),
      reverseOption,
      45000
    );
  }

  async scrollIntoViewAndClick(element) {
    await (await element).waitForClickable({ timeout: 3000 });
    await (await element).scrollIntoView();
    return (await element).click();
  }

  switchToTab(title, timeout = 5000) {
    return browser.waitUntil(
      async () => {
        try {
          await browser.switchWindow(title);
          return true;
        } catch (e) {}
      },
      {
        timeout,
        timeoutMsg: `Could not switch to tab "${title}" after ${timeout}ms`
      }
    );
  }

  async waitForDisplayedNoError(
    element,
    reverseOption = false,
    timeoutMs = 5000
  ) {
    try {
      return await (
        await element
      ).waitForDisplayed({ reverse: reverseOption, timeout: timeoutMs });
    } catch (ElementNotVisibleException) {
      return false;
    }
  }

  async waitForEnabledNoError(
    element,
    reverseOption = false,
    timeoutMs = 5000
  ) {
    try {
      return await (
        await element
      ).waitForEnabled({ reverse: reverseOption, timeout: timeoutMs });
    } catch (ElementNotVisibleException) {
      return false;
    }
  }

  async waitForEnabledThenClick(element, timeoutMs = 3000) {
    await (await element).waitForClickable({ timeout: timeoutMs });
    await browser.pause(700);
    await (await element).click();
  }

  async waitForSelectedNoError(element, reverse = false, timeoutMs = 5000) {
    let status;
    try {
      status = await (
        await element
      ).waitUntil(
        async function () {
          if (reverse) {
            return (await await this.isSelected()) === false;
          }
          return (await await this.isSelected()) === true;
        },
        {
          timeout: timeoutMs,
          timeoutMsg: "Timeout while waiting on condition."
        }
      );
    } catch (error) {
      status = false;
    }
    return status;
  }

  async waitUntilAttributeValueIs(
    element,
    attribute,
    expectedValue,
    timeoutVal = 5000,
    reverse = false
  ) {
    await (await element).waitForEnabled({ timeout: 2000 });
    let status;
    try {
      status = await (
        await element
      ).waitUntil(
        async function () {
          if (reverse) {
            return (await await this.getAttribute(attribute)) !== expectedValue;
          }
          return (await await this.getAttribute(attribute)) === expectedValue;
        },
        {
          timeout: timeoutVal,
          timeoutMsg: "Timeout while waiting on condition."
        }
      );
    } catch (error) {
      status = false;
    }
    return status;
  }

  async waitUntilTextIs(element, text, timeoutVal = 5000) {
    return await (
      await element
    ).waitUntil(
      async function () {
        return (await await this.getText()) === text;
      },
      {
        timeout: timeoutVal,
        timeoutMsg: "Timeout while waiting on condition."
      }
    );
  }

  async clearValue(selector) {
    await browser.executeScript(
      (text) => {
        document.querySelector(text).value = "";
      },
      [selector]
    );
  }

  async scriptClick(selector) {
    await browser.executeScript(
      (text) => {
        document.querySelector(text).click();
      },
      [selector]
    );
  }
}

module.exports = BasePage;
