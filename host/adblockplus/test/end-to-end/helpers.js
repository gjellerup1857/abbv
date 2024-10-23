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

require("dotenv").config({path: ["../../.env.e2e", "../../.env.e2e.defaults"]});
const fs = require("fs");
const path = require("path");

const GeneralPage = require("./page-objects/general.page");
const PremiumPage = require("./page-objects/premium.page");
const PremiumCheckoutPage = require("./page-objects/premiumCheckout.page");
const PremiumHeaderChunk = require("./page-objects/premiumHeader.chunk");

const globalRetriesNumber = 0;
const isGitlab = process.env.CI === "true";

const chromeBuildMV2 =
  findFirstMatchingFile(`../../${process.env.CHROME_BUILD_MV2}`);
const chromeBuildMV3 =
  findFirstMatchingFile(`../../${process.env.CHROME_BUILD_MV3}`);
const firefoxBuild = findFirstMatchingFile(
  `../../${process.env.FIREFOX_BUILD}`);

const distPath = path.join(process.cwd(), "..", "..", "dist");
const helperExtensionMV2Path =
  path.join(distPath, "devenv", "helper-extension-mv2.zip");
const helperExtensionMV3Path =
  path.join(distPath, "devenv", "helper-extension-mv3.zip");
const helperExtensionMV3UnpackedPath =
  path.join(distPath, "devenv", "helper-extension-mv3");

const testConfig = {
  allureEnabled: process.env.ENABLE_ALLURE === "true",
  browserName: process.env.BROWSER,
  screenshotsPath: path.join(process.cwd(), "screenshots"),
  releasePath: path.join(distPath, "release"),
  chromeBuildMV3,
  helperExtensionMV3UnpackedPath
};

async function afterSequence(optionsUrl = null)
{
  await switchToABPOptionsTab({optionsUrl, refresh: true});

  const generalPage = new GeneralPage(browser);
  await generalPage.init();

  await waitForAbleToExecuteScripts();
}

async function beforeSequence({
  expectInstalledTab = true,
  isSmokeTest = false
} = {expectInstalledTab: true})
{
  if (isFirefox())
  {
    await browser.installAddOn(getFirefoxExtension(), true);
    await browser.pause(500);
    await browser.installAddOn(getHelperExtension("MV2"), true);
  }

  const {origin, optionsUrl} = await waitForExtension();
  let installedUrl;
  if (expectInstalledTab)
  {
    const timeout = process.env.MANIFEST_VERSION == "3" ? 50000 : 25000;
    try
    {
      await browser.waitUntil(async() =>
      {
        for (const handle of await browser.getWindowHandles())
        {
          await browser.switchToWindow(handle);
          installedUrl = await browser.getUrl();
          if (/installed|first-run/.test(installedUrl))
          {
            await browser.url("about:blank"); // Ensures at least one open tab
            return true;
          }
        }
      }, {
        timeout,
        interval: 2000,
        timeoutMsg: `Installed page didn't open after ${timeout}ms`
      });
    }
    catch (e)
    {
      if (isSmokeTest)
      {
        throw new Error(`Installed page didn't open after ${timeout}ms` +
          " while executing a smoke test"
        );
      }
    }
  }

  if (process.env.LOCAL_RUN !== "true")
    await browser.setWindowSize(1400, 1000);

  // beforeSequence() is usually called once at the beggining of test suites
  // right after extension installation. That may stress the browser for a while
  // which may lead to a situation where the options page is not found (Firefox)
  // To mitigate that, `optionsUrl` is passed here to trigger the fallback
  // mechanism in switchToABPOptionsTab()
  await afterSequence(optionsUrl);

  if (isFirefox())
  {
    process.env.MANIFEST_VERSION = "2";
  }
  else
  {
    const manifestVersion = await browser.
      executeScript(
        "return browser.runtime.getManifest().manifest_version;", []);
    process.env.MANIFEST_VERSION = manifestVersion.toString();
  }

  return {origin, optionsUrl, installedUrl};
}

async function doesTabExist(tabName, timeout = 3000, countThreshold = 1)
{
  const startTime = new Date().getTime();
  let count = 0;
  const checkTab = async(tabIdentifier) =>
  {
    if (typeof tabIdentifier === "string")
    {
      const title = await browser.getTitle();
      const url = await browser.getUrl();
      return title === tabIdentifier || url === tabIdentifier;
    }
    else if (tabIdentifier instanceof RegExp)
    {
      const url = await browser.getUrl();
      return tabIdentifier.test(url);
    }
    return false;
  };
  while (new Date().getTime() - startTime < timeout)
  {
    const tabs = await browser.getWindowHandles();
    for (const tab of tabs)
    {
      await browser.switchToWindow(tab);
      if (await checkTab(tabName))
      {
        count++;
      }
    }
    if (count >= countThreshold)
    {
      return true;
    }
    await browser.pause(200);
  }
  return false;
}

async function enablePremiumByMockServer()
{
  await wakeMockServer("https://qa-mock-licensing-server.glitch.me/",
                       "Mock licensing server is up and running");
  await switchToABPOptionsTab();
  await browser.executeScript(`
    Promise.all([
      new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "prefs.set",
          key: "premium_license_check_url",
          value: "https://qa-mock-licensing-server.glitch.me/"},
          response => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      }),
      new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "premium.activate",
        userId: "valid_user_id"}, response => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      })
    ]).then(results => console.log(results));
  `, []);

  const premiumHeaderChunk = new PremiumHeaderChunk(browser);
  const timeout = 15000;
  await browser.waitUntil(async() =>
  {
    try
    {
      await premiumHeaderChunk.premiumButton.waitForDisplayed();
      return true;
    }
    catch (e)
    {
      await browser.refresh();
    }
  }, {timeout, timeoutMsg: `Premium button not displayed after ${timeout}ms`});
}

async function enablePremiumByUI()
{
  const premiumHeaderChunk = new PremiumHeaderChunk(browser);
  await premiumHeaderChunk.clickUpgradeButton();
  await premiumHeaderChunk.
    switchToTab(/accounts.adblockplus.org\/en\/premium/);
  let currentUrl = await premiumHeaderChunk.getCurrentUrl();
  if (!currentUrl.includes("accounts"))
  {
    await premiumHeaderChunk.
      switchToTab(/accounts.adblockplus.org\/en\/premium/);
    await browser.pause(1000);
    currentUrl = await premiumHeaderChunk.getCurrentUrl();
  }
  await browser.url(currentUrl + "&testmode");
  const premiumPage = new PremiumPage(browser);
  await premiumPage.clickGetPremiumMonthlyButton();
  await premiumPage.clickPremiumCheckoutButton();
  const premiumCheckoutPage = new PremiumCheckoutPage(browser);
  await premiumCheckoutPage.init();
  await premiumCheckoutPage.typeTextToEmailField("test_automation" +
    randomIntFromInterval(1000000, 9999999).toString() + "@adblock.org");
  await premiumCheckoutPage.typeTextToZIPField("10001");
  await premiumCheckoutPage.clickContinueButton();
  await premiumCheckoutPage.typeTextToCardNumberField("4242424242424242");
  await premiumCheckoutPage.typeTextToCardExpiryField("0528");
  await premiumCheckoutPage.typeTextToCardCvcField("295");
  await premiumCheckoutPage.typeTextToNameOnCardField("Test Automation");
  await premiumCheckoutPage.clickSubscribeButton();

  // Real premium takes a while to be enabled
  const timeout = 80000;
  await browser.waitUntil(async() =>
  {
    try
    {
      await premiumHeaderChunk.premiumButton.waitForDisplayed();
      return true;
    }
    catch (e)
    {
      await switchToABPOptionsTab({refresh: true});
    }
  }, {timeout, timeoutMsg: `Premium button not displayed after ${timeout}ms`});
}

async function executeAsyncScript(script, ...args)
{
  const [isError, value] = await browser.executeAsyncScript(`
    let promise = (async function() { ${script} }).apply(null, arguments[0]);
    let callback = arguments[arguments.length - 1];
    promise.then(
      res => callback([false, res]),
      err => callback([true, err instanceof Error ? err.message : err])
    );`, args);

  if (isError)
    throw new Error(value);
  return value;
}

async function getABPOptionsTabId()
{
  await switchToABPOptionsTab({switchToFrame: false});
  const currentTab = await browser.executeAsyncScript(`
    function getTabID()
    {
      return new Promise((resolve, reject) =>
      {
        try
        {
          chrome.tabs.query({active: true,}, function (tabs)
          {
            resolve(tabs[0].id);})} catch (e) {reject(e);
          }
        })
      }
      async function returnID()
      {
        let responseTabID = await getTabID();
        return responseTabID;}
        var callback = arguments[arguments.length - 1];
        returnID().then((data)=> {callback(data)
      });`, []);
  return currentTab;
}

function findFirstMatchingFile(pathWithPattern)
{
  const dir = path.dirname(pathWithPattern);
  const pattern = path.basename(pathWithPattern);
  const regexPattern = new RegExp(pattern.replace("*", ".*"));

  let files;
  try
  {
    files = fs.readdirSync(dir);
  }
  catch (err)
  {
    if (!err.message.includes("ENOENT: no such file or directory"))
      throw err;

    throw new Error("The 'dist/release/' folder does not exist");
  }

  const firstFile = files.find(file => regexPattern.test(file));
  if (firstFile)
    return path.join(dir, firstFile);

  console.warn(`No file with pattern ${pattern} found in dir ${dir}`);
}

function getExtension(extensionPath)
{
  return fs.readFileSync(extensionPath).toString("base64");
}

function getChromiumMV2Extension()
{
  return getExtension(chromeBuildMV2);
}

function getFirefoxExtension()
{
  return getExtension(firefoxBuild);
}

function getHelperExtension(manifestVersion)
{
  let helperExtensionPath;
  if (manifestVersion == "MV2")
  {
    helperExtensionPath = helperExtensionMV2Path;
  }
  else if (manifestVersion == "MV3")
  {
    helperExtensionPath = helperExtensionMV3Path;
  }
  return getExtension(helperExtensionPath);
}

function getCurrentDate(locale)
{
  return new Date().toLocaleDateString(locale);
}

function randomIntFromInterval(min, max)
{
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function switchToABPOptionsTab(options = {})
{
  const defaultOptions =
    {switchToFrame: true, optionsUrl: null, refresh: false};
  const {switchToFrame, optionsUrl, refresh} = {...defaultOptions, ...options};
  const timeout = 5000;
  const quickTimeout = 1000;

  const generalPage = new GeneralPage(browser);
  try
  {
    await generalPage.switchToTab("Adblock Plus Options", quickTimeout);
  }
  catch (err)
  {
    // optionsUrl is passed when the options tab is expected to be closed
    if (!optionsUrl)
      throw err;

    // When the extension reloads WDIO seems to get confused about the current
    // tab, producing a "no such window" error on any browsing command.
    // Switching to the handle of any open tab as a workaround.
    await browser.switchToWindow((await browser.getWindowHandles())[0]);
    await browser.url(optionsUrl);
    await generalPage.switchToTab("Adblock Plus Options", timeout);
  }

  if (refresh)
    await browser.refresh();

  if (!switchToFrame)
    return;

  await browser.waitUntil(async() =>
  {
    if (await generalPage._generalTabButton.isClickable())
      return true; // already in the content frame

    try
    {
      await browser.switchToFrame(await $("#content"));
      return true;
    }
    catch (e) {}
  }, {
    timeout,
    timeoutMsg: `Could not switch to options content frame after ${timeout}ms`
  });
}

function waitForSwitchToABPOptionsTab(optionsUrl, timeout = 5000)
{
  return browser.waitUntil(async() =>
  {
    try
    {
      await switchToABPOptionsTab({optionsUrl});
      return true;
    }
    catch (e) {}
  }, {
    timeout,
    interval: 1000,
    timeoutMsg: `Could not switch to ABP Options Tab after ${timeout}ms`
  });
}

// Wait until the extension doesn't make webdriver throw when running scripts
// Only needed by firefox
async function waitForAbleToExecuteScripts(timeout = 15000)
{
  if (!isFirefox())
    return;

  return browser.waitUntil(async() =>
  {
    try
    {
      return await browser.executeScript("return true;", []);
    }
    catch (e) {}
  }, {
    timeout,
    interval: 2000,
    timeoutMsg: `Webdriver can't execute scripts after ${timeout}ms`
  });
}

// Under stress conditions, for some reason browser.newWindow() may silently
// fail. This is a workaround to ensure it either worked or timed out
async function waitForNewWindow(url, timeout = 5000)
{
  await browser.newWindow(url);
  return browser.waitUntil(async() =>
  {
    try
    {
      await browser.switchWindow(url);
      return true;
    }
    catch (e)
    {
      await browser.url(url);
    }
  }, {
    timeout,
    timeoutMsg: `Could not open new window "${url}" after ${timeout}ms`
  });
}

// Polling expect function calls until they pass
async function waitForAssertion(expectFn, timeout = 5000, message = "Timed out",
                                interval = 500)
{
  return browser.waitUntil(async() =>
  {
    try
    {
      await expectFn();
      return true;
    }
    catch (e)
    {
      await browser.refresh();
    }
  }, {timeout, interval, timeoutMsg: `${message} after ${timeout}ms`});
}

async function waitForCondition(condition, object = null, waitTime = 150000,
                                refresh = true, pauseTime = 200, text = null)
{
  let waitTimeMS = 0;
  let conditionResult = false;
  while (waitTimeMS <= waitTime)
  {
    if (refresh)
    {
      await browser.refresh();
    }
    if (object !== null)
    {
      if (text !== null)
      {
        conditionResult = (await object[condition]()).includes(text);
      }
      else
      {
        conditionResult = await object[condition]();
      }
    }
    else
    {
      conditionResult = await condition;
    }
    if (conditionResult == true)
    {
      break;
    }
    else
    {
      await browser.pause(pauseTime);
      waitTimeMS += pauseTime;
    }
  }
  if (waitTimeMS >= waitTime)
  {
    throw new Error("Condition was not met within the waitTime!");
  }
}

async function waitForExtension()
{
  const timeout = 20000;
  let origin;
  let optionsUrl;

  await waitForAbleToExecuteScripts();

  await browser.waitUntil(async() =>
  {
    for (const handle of await browser.getWindowHandles())
    {
      await browser.switchToWindow(handle);

      ({origin, optionsUrl} = await browser.executeAsync(async callback =>
      {
        if (typeof browser !== "undefined" &&
            browser.management !== "undefined")
        {
          const info = await browser.management.getSelf();
          callback(info.optionsUrl ?
            {origin: location.origin, optionsUrl: info.optionsUrl} : {});
        }
        else
        {
          callback({});
        }
      }));
      if (origin)
      {
        return true;
      }
    }
  }, {timeout, timeoutMsg: `Options page not found after ${timeout}ms`});

  return {origin, optionsUrl};
}

async function wakeMockServer(serverUrl, serverUpText)
{
  await browser.newWindow(serverUrl);
  const generalPage = new GeneralPage(browser);
  await generalPage.isMockServerUpTextDisplayed(serverUpText);
  await browser.closeWindow();
}

/**
 * Gets the ID of current tab using the browser.tabs WebExtension API.
 * This is mainly used to work with the popup when it is open in a tab.
 * ⚠️ Make sure the tab you are targeting is loaded before trying to retrieve
 * its ID
 * @param {object} options
 * @param {string} options.title - The title of the tab
 * @param {string} options.urlPattern - A url [match pattern string](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns)
 * @returns {Number} `browser.tabs.TAB_ID_NONE` when tab was not found,
 * or the tab ID from the browser.tabs Web extension API.
 */
async function getTabId({title, urlPattern})
{
  const currentWindowHandle = await browser.getWindowHandle();
  await switchToABPOptionsTab({switchToFrame: false});

  const queryOptions = {};
  if (title)
  {
    queryOptions.title = title;
  }
  if (urlPattern)
  {
    queryOptions.url = urlPattern;
  }

  const tabId = await browser.executeAsync(async(params, done) =>
  {
    try
    {
      const tabs = await browser.tabs.query(params.queryOptions);
      if (tabs.length)
      {
        done(tabs[0].id);
        return;
      }
    }
    catch (error)
    {
      console.error(error);
    }

    done(browser.tabs.TAB_ID_NONE);
  }, {queryOptions});

  await browser.switchToWindow(currentWindowHandle);

  return tabId;
}

function lambdatestRunChecks()
{
  if (isGitlab)
  {
    return;
  }

  if (!process.env.LT_USERNAME || !process.env.LT_ACCESS_KEY)
  {
    console.error("\x1b[33m%s\x1b[0m", `
-----------------------------------------------------------------
Please set the following environment variables in the .env.e2e file:
LT_USERNAME
LT_ACCESS_KEY
https://www.lambdatest.com/support/docs/using-environment-variables-for-authentication-credentials/
-----------------------------------------------------------------
    `);
    process.exit(1);
  }
}

function isBrowser(browserName)
{
  return browser.capabilities.browserName.toLowerCase().includes(browserName);
}

function isChrome()
{
  return isBrowser("chrome");
}

function isFirefox()
{
  return isBrowser("firefox");
}

function isEdge()
{
  return isBrowser("edge");
}

async function uninstallExtension()
{
  await browser.executeScript("browser.management.uninstallSelf();", []);

  const generalPage = new GeneralPage(browser);
  await generalPage.switchToUninstalledTab();

  return await browser.getUrl();
}


/**
 * Adds filters to the extension using the filters.importRaw message
 * @param {string} filters - Filters text to add
 * @returns {Promise<void>}
 */
async function addFiltersToABP(filters)
{
  const error = await browser.executeAsync(async(filtersToAdd, callback) =>
  {
    const [errors] = await browser.runtime.sendMessage(
      {type: "filters.importRaw", text: filtersToAdd}
    );
    if (typeof errors != "undefined" && errors[0])
      callback(errors[0]);

    callback();
  }, filters);

  if (error)
    throw new Error(error);
}

module.exports = {
  afterSequence, beforeSequence, doesTabExist,
  executeAsyncScript, testConfig,
  enablePremiumByMockServer, wakeMockServer, lambdatestRunChecks,
  getChromiumMV2Extension, getFirefoxExtension, getHelperExtension,
  getCurrentDate, getTabId, enablePremiumByUI,
  randomIntFromInterval, globalRetriesNumber, switchToABPOptionsTab,
  waitForExtension, getABPOptionsTabId, waitForCondition,
  waitForSwitchToABPOptionsTab, waitForNewWindow, waitForAssertion, isChrome,
  isFirefox, isEdge, uninstallExtension,
  addFiltersToABP
};
