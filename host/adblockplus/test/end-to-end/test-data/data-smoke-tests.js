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

module.exports = {
  an_chromium: "adblockpluschrome",
  an_firefox: "adbockplusfirefox",
  ap_chrome: "chrome",
  ap_edge: "edge",
  ap_firefox: "firefox",
  blockHideUrl: "http://localhost:3005/blocking-hiding-testpage.html",
  allowlistingFilter: "@@||localhost^$document",
  customBlockingFilters: [
    "/pop_ads.js", // no longer exists in EasyList
    "localhost###search-ad", // Needed to override EasyList's "@@://localhost:$generichide"
    "localhost##.AdContainer" // Needed to override EasyList's "@@://localhost:$generichide"
  ],
  p_chromium: "chromium",
  p_firefox: "gecko",
  regex_an: /(?<=an=).+?(?=&)/,
  regex_av: /(?<=av=).+?(?=&)/,
  regex_ap: /(?<=ap=).+?(?=&)/,
  regex_apv: /(?<=apv=).+?(?=&)/,
  regex_p: /(?<=&p=).+?(?=&)/,
  regex_pv: /(?<=&pv=)[^&]+|$/,
  regexBrowserVersion: /(?<=browserVersion":").*?(?=")/,
  regexMajorBrowserVersion: /(?<=browserVersion":").*?(?=\.)/,
  regexMajorBrowserVersionFF: /(?<=rv:)\d+/,
  regexManifestVersion: /(?<="version": ").*?(?=")/,
  snippetsPageUrl:
    "https://eyeo.gitlab.io/browser-extensions-and-premium/supplemental/QA-team/adblocking/snippets" +
    "/snippets-testpage.html"
};
