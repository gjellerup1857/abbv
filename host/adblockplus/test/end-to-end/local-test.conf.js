/* eslint-disable quote-props */
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

const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");

const helpers = require("./helpers.js");
const {suites} = require("./suites.js");

// require of ES Modules is not supported. Using dynamic imports instead
let runTestServer;
let killTestServer;
import("@eyeo/test-utils/test-server-manager.js").then(mod =>
{
  ({runTestServer, killTestServer} = mod);
});

const {allureEnabled, browserName, screenshotsPath, releasePath, chromeBuildMV3,
       helperExtensionMV3UnpackedPath} = helpers.testConfig;

const browserCapabilities = [];
const chromiumOptions = {
  args: [
    "--no-sandbox",
    "--window-size=1400,1000",
    "--disable-search-engine-choice-screen",
    // EXT-497: we need to bind "testpages.adblockplus.org" to "localhost"
    // to be able to test with locally hosted page.
    "--ignore-certificate-errors",
    "--host-resolver-rules=MAP testpages.adblockplus.org 127.0.0.1"
  ]
};

if (process.env.MANIFEST_VERSION === "3")
{
  // For some reason loading the MV3 zipped extension on docker produces a
  // `webdriver: RequestError: write ECONNRESET` error.
  // Unzipping it to load it unpacked
  const chromeExtensionUnpackedPath = path.join(releasePath, "chrome-unpacked");
  fs.rmSync(chromeExtensionUnpackedPath, {force: true, recursive: true});

  const zip = new AdmZip(chromeBuildMV3);
  zip.extractAllTo(chromeExtensionUnpackedPath, true);

  chromiumOptions.args.push("--load-extension=" +
    `${chromeExtensionUnpackedPath},${helperExtensionMV3UnpackedPath}`);
}
else
{
  chromiumOptions.extensions =
    browserName === "chromium" || browserName === "edge" ? [
      helpers.getChromiumMV2Extension(),
      helpers.getHelperExtension("MV2")
    ] : [];
}

const firefoxOptions = {args: [
  "-width=1400",
  "-height=1000"
]};

if (process.env.FORCE_HEADFUL !== "true")
{
  chromiumOptions.args.push("--headless=new");
  firefoxOptions.args.push("-headless");
}

if (browserName === "chromium")
{
  browserCapabilities.push({
    browserName: "chromium",
    "goog:chromeOptions": chromiumOptions,
    acceptInsecureCerts: true,
    exclude: [
      "./tests/legacy-unit.js"
    ]
  });
}
else if (browserName === "firefox")
{
  browserCapabilities.push({
    browserName: "firefox",
    "moz:firefoxOptions": firefoxOptions,
    acceptInsecureCerts: true,
    exclude: [
      "./tests/test-issue-reporter.js",
      "./tests/legacy-unit.js"
    ]
  });
}
else if (browserName === "edge")
{
  const edgeCapabilities = {
    browserName: "MicrosoftEdge",
    "ms:edgeOptions": chromiumOptions,
    acceptInsecureCerts: true,
    exclude: [
      "./tests/test-issue-reporter.js",
      "./tests/legacy-unit.js"
    ]
  };

  // On Docker, sometimes `Error: End of central directory not found` appears
  // when WDIO runs the edgedriver script. Setting the edgedriver binary path
  // as a workaround. `EDGDEDRIVER_PATH` is set in `Dockerfile`.
  if (process.env.EDGDEDRIVER_PATH)
  {
    edgeCapabilities["wdio:edgedriverOptions"] = {
      binary: process.env.EDGDEDRIVER_PATH
    };
  }

  browserCapabilities.push(edgeCapabilities);
}

async function manageScreenshot(test, error)
{
  if (!error || error.constructor.name == "Pending") // Pending means skipped
    return;

  try
  {
    const title = test.title.replaceAll(" ", "_").replaceAll("\"", "")
      .replaceAll(":", "").replaceAll("/", "_");
    await browser.saveScreenshot(path.join(screenshotsPath, `${title}.png`));
  }
  catch (err)
  {
    console.warn(`Screenshot could not be saved: ${err}`);
  }
}

exports.config = {
  suites,
  maxInstances: Number(process.env.MAX_INSTANCES) || 1,
  capabilities: browserCapabilities,
  logLevel: "error",
  logLevels: {
    webdriver: "silent",
    "@wdio/local-runner": "silent"
  },
  bail: 0,
  waitforTimeout: 10000,
  // connectionRetryTimeout is used on the initial browser instance loading
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: "mocha",
  reporters: allureEnabled ? [["allure", {
    outputDir: "allure-results",
    disableWebdriverStepsReporting: true,
    disableWebdriverScreenshotsReporting: false
  }]] : [["spec", {
    realtimeReporting: true,
    showPreface: false
  }]],
  mochaOpts: {
    ui: "bdd",
    timeout: 300000
  },
  async before()
  {
    process.env.LOCAL_RUN = "true";
    await fs.promises.mkdir(screenshotsPath, {recursive: true});
    await runTestServer();
    // eslint-disable-next-line no-console
    console.log(`MANIFEST_VERSION=${process.env.MANIFEST_VERSION}`);
  },
  async afterHook(test, context, {error})
  {
    await manageScreenshot(test, error);
  },
  async afterTest(test, context, {error})
  {
    await manageScreenshot(test, error);
  },
  async after()
  {
    await killTestServer();
  }
};
