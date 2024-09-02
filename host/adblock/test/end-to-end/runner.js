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

/* eslint-env node */
/* eslint-env mocha */
/* eslint-disable no-console */

import path from "path";
import fs from "fs";

import AdmZip from "adm-zip";
import { BROWSERS } from "@eyeo/get-browser-binary";

import { findUrl } from "./utils.js";
import defineTestSuites from "./suites/index.js";

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
  const options = { headless: true, extensionPaths };
  const driver = await BROWSERS[browser].getDriver(version, options);

  const cap = await driver.getCapabilities();
  console.log(`Browser used for tests: ${cap.getBrowserName()} ${cap.getBrowserVersion()}`);

  return driver;
}

describe("AdBlock end-to-end tests", function () {
  before(async function () {
    this.driver = await startBrowser();

    await findUrl(this.driver, "options.html");
  });

  after(async function () {
    if (this.driver) {
      await this.driver.quit();
    }
  });

  defineTestSuites();
});
