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

/* eslint-disable no-console */

import path from "path";
import fs from "fs";

import AdmZip from "adm-zip";
import { BROWSERS, getMajorVersion } from "@eyeo/get-browser-binary";
import { runTestServer, killTestServer } from "@eyeo/test-utils/test-server-manager.js";

import { findUrl } from "./utils/driver.js";
import { setOptionsHandle } from "./utils/hook.js";
import defineTestSuites from "./suites/index.js";

const screenshotsPath = path.join(process.cwd(), "test", "end-to-end", "screenshots");

async function extractExtension(browser) {
  const manifestVersion = process.env.MANIFEST_VERSION || "3";
  const releasePath = path.join(process.cwd(), "dist", "release");
  const files = await fs.promises.readdir(releasePath);

  let buildRegex;
  if (manifestVersion === "3") {
    buildRegex = /adblock-chrome-.*-mv3.zip/;
  } else if (browser === "edge") {
    buildRegex = /adblock-chrome-.*-mv2.zip/;
  } else {
    buildRegex = /adblock-firefox-.*-mv2.xpi/;
  }
  const [releaseFile] = files.filter((f) => buildRegex.test(f));

  if (!releaseFile) {
    throw new Error(`${buildRegex} was not found in ${releasePath}`);
  }

  const unpackedPath = path.join(releasePath, "adblock-unpacked");
  await fs.promises.rm(unpackedPath, { force: true, recursive: true });
  const zip = new AdmZip(path.join(releasePath, releaseFile));
  zip.extractAllTo(unpackedPath, true);

  return unpackedPath;
}

async function startBrowser() {
  const browser = process.env.BROWSER || "chromium";
  const version = "latest";

  const { versionNumber } = await BROWSERS[browser].installBrowser(version);
  console.log(`Installed ${browser} ${versionNumber} ...`);

  const adblockPath = await extractExtension(browser);
  const extensionPaths = [
    path.join(process.cwd(), "dist", "devenv", "helper-extension"),
    adblockPath,
  ];
  const headless = process.env.FORCE_HEADFUL !== "true";
  const extraArgs =
    browser === "firefox" ? ["-width=1400", "-height=1000"] : ["--window-size=1400,1000"];
  const options = { headless, extensionPaths, extraArgs };
  const driver = await BROWSERS[browser].getDriver(version, options);

  const cap = await driver.getCapabilities();
  const browserVersion = cap.getBrowserVersion();
  console.log(`Browser: ${cap.getBrowserName()} ${browserVersion}`);

  return [driver, browser, browserVersion, getMajorVersion(browserVersion)];
}

async function getExtensionInfo(driver) {
  const info = await driver.executeAsyncScript(async (callback) => {
    if (typeof browser !== "undefined" && browser.management !== "undefined") {
      let { shortName, version, permissions, optionsUrl } = await browser.management.getSelf();
      const origin = optionsUrl ? location.origin : null;
      const manifest = await browser.runtime.getManifest();
      const popupPath =
        manifest.manifest_version == "3"
          ? manifest.action.default_popup
          : manifest.browser_action.default_popup;
      const popupUrl = manifest.applications?.gecko ? popupPath : `${origin}/${popupPath}`;
      callback({ name: shortName, version, origin, permissions, popupUrl });
    } else {
      callback({});
    }
  });
  if (!info.origin) {
    throw new Error("Origin was not found");
  }

  info.manifestVersion = 2;
  if (
    info.permissions.includes("declarativeNetRequest") ||
    info.permissions.includes("declarativeNetRequestWithHostAccess")
  ) {
    info.manifestVersion = 3;
  }

  return info;
}

describe("AdBlock end-to-end tests", function () {
  before(async function () {
    // This section downloads the browser, which could take a long time
    // depending on the internet connection speed. Best to disable the normal
    // timeout for this bit.
    this.timeout(0);
    await fs.promises.mkdir(screenshotsPath, { recursive: true });

    [this.driver, this.browserName, this.fullBrowserVersion, this.majorBrowserVersion] =
      await startBrowser();

    // Set global variables for the tests
    global.driver = this.driver;
    global.browserName = this.browserName;
    global.fullBrowserVersion = this.fullBrowserVersion;
    global.majorBrowserVersion = this.majorBrowserVersion;

    await runTestServer();
  });

  before(async function () {
    const { handle } = await findUrl(this.driver, "options.html", 6000);
    setOptionsHandle(handle);

    const { name, version, manifestVersion, origin, popupUrl } = await getExtensionInfo(
      this.driver,
    );
    console.log(`Extension: ${name} ${version} MV${manifestVersion}`);

    this.origin = origin;
    this.popupUrl = popupUrl;
    this.manifestVersion = manifestVersion;
    global.extOrigin = origin;
    global.manifestVersion = manifestVersion;
  });

  afterEach(async function () {
    if (this.currentTest.state !== "failed") {
      return;
    }

    const data = await this.driver.takeScreenshot();
    const base64Data = data.replace(/^data:image\/png;base64,/, "");
    const title = this.currentTest.title.replaceAll(" ", "_");

    await fs.promises.writeFile(path.join(screenshotsPath, `${title}.png`), base64Data, "base64");
  });

  after(async function () {
    if (this.driver) {
      await this.driver.quit();
    }
    await killTestServer();
  });

  defineTestSuites();
});
