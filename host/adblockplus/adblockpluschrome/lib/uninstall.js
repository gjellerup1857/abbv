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

/** @module uninstall */

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { Prefs } from "./prefs.js";
import { isDataCorrupted } from "./subscriptionInit.js";
import { info } from "../../src/info/background";
import { getPremiumState } from "../../src/premium/background";

const abbreviations = [
  ["an", "addonName"],
  ["ap", "application"],
  ["apv", "applicationVersion"],
  ["av", "addonVersion"],
  ["c", "corrupted"],
  ["er", "experimentsRevision"],
  ["ev", "experimentsVariants"],
  ["fv", "firstVersion"],
  ["ndc", "notificationDownloadCount"],
  ["p", "platform"],
  ["ps", "premiumStatus"],
  ["pv", "platformVersion"],
  ["s", "subscriptions"],
  ["wafc", "webAllowlistingFilterCount"]
];

/**
 * Returns the number of currently active filters that have been added using
 * the experimental allowlisting functionality (i.e. that originated in the
 * web, and not in the extension popup).
 *
 * @returns {number} The filter count
 */
async function getWebAllowlistingFilterCount() {
  // get all allowlisting filters that are enabled
  const filters = (await ewe.filters.getUserFilters()).filter(
    (filter) => filter.type === "allowing" && filter.enabled
  );

  // collect their metadata
  const filtersMetadata = await Promise.all(
    filters.map(async (filter) => await ewe.filters.getMetadata(filter.text))
  );

  // count the ones that originated in the web
  return filtersMetadata.filter((data) => data && data.origin === "web").length;
}

/**
 * Retrieves set of URLs of recommended ad blocking filter lists
 *
 * @return {Set}
 */
function getAdsSubscriptions() {
  let subscriptions = new Set();
  for (let subscription of ewe.subscriptions.getRecommendations())
    if (subscription.type == "ads") subscriptions.add(subscription.url);
  return subscriptions;
}

/**
 * Converts BigInt number to bytes array
 *
 * @param {BigInt} bn - Number
 * @returns {Uint8Array} bytes array
 */
function bnToBytes(bn) {
  let hex = BigInt(bn).toString(16);
  if (hex.length % 2) hex = `0${hex}`;

  const length = hex.length / 2;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++)
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);

  return bytes;
}

/**
 * Retrieves split experiments assignments. It is compressed as base64-encoded
 * bitmap due to limited space in the uninstall URL.
 * @link https://eyeo.atlassian.net/browse/DATA-2793
 *
 * @returns {string} split experiments assignments
 */
async function getExperiments() {
  let variantsBitmap = 0n;

  const experiments = await ewe.experiments.getExperiments();
  for (const experiment of [...experiments].reverse()) {
    for (const variant of [...experiment.variants].reverse()) {
      variantsBitmap |= variant.assigned ? 1n : 0n;
      variantsBitmap <<= 1n;
    }
  }
  variantsBitmap >>= 1n;

  const bytes = bnToBytes(variantsBitmap);
  const base64 = btoa(String.fromCharCode(...bytes));

  return base64;
}

/**
 * Determines whether any of the given subscriptions are installed and enabled
 *
 * @param {Set} urls
 *
 * @return {boolean}
 */
async function isAnySubscriptionActive(urls) {
  for (let subscription of await ewe.subscriptions.getSubscriptions())
    if (subscription.enabled && urls.has(subscription.url)) return true;

  return false;
}

/**
 * Sets (or updates) the URL that is openend when the extension is uninstalled.
 *
 * Must be called after prefs got initialized and a data corruption
 * if any was detected, as well when notification data change.
 */
export async function setUninstallURL() {
  let search = [];
  let params = Object.create(info);

  params.corrupted = isDataCorrupted() ? "1" : "0";
  params.experimentsRevision = await ewe.experiments.getRevisionId();
  params.experimentsVariants = await getExperiments();
  params.firstVersion = ewe.reporting.getFirstVersion();

  let notificationDownloadCount = await ewe.notifications.getDownloadCount();
  if (notificationDownloadCount < 5)
    params.notificationDownloadCount = notificationDownloadCount;
  else if (notificationDownloadCount < 8)
    params.notificationDownloadCount = "5-7";
  else if (notificationDownloadCount < 30)
    params.notificationDownloadCount = "8-29";
  else if (notificationDownloadCount < 90)
    params.notificationDownloadCount = "30-89";
  else if (notificationDownloadCount < 180)
    params.notificationDownloadCount = "90-179";
  else params.notificationDownloadCount = "180+";

  let aaSubscriptions = new Set([ewe.subscriptions.ACCEPTABLE_ADS_URL]);
  let adsSubscriptions = getAdsSubscriptions();
  let isAcceptableAdsActive = await isAnySubscriptionActive(aaSubscriptions);
  let isAdBlockingActive = await isAnySubscriptionActive(adsSubscriptions);
  params.subscriptions = (isAcceptableAdsActive << 1) | isAdBlockingActive;
  let premiumState = await getPremiumState();
  params.premiumStatus = premiumState.isActive ? 1 : 0;
  params.webAllowlistingFilterCount = await getWebAllowlistingFilterCount();

  for (let [abbreviation, key] of abbreviations)
    search.push(abbreviation + "=" + encodeURIComponent(params[key]));

  browser.runtime.setUninstallURL(
    Prefs.getDocLink("uninstalled") + "&" + search.join("&")
  );
}

export function start() {
  ewe.experiments.onChanged.addListener(setUninstallURL);

  ewe.notifications.on("downloaded", setUninstallURL);

  ewe.filters.onAdded.addListener(setUninstallURL);
  ewe.filters.onChanged.addListener(setUninstallURL);
  ewe.filters.onRemoved.addListener(setUninstallURL);

  ewe.subscriptions.onAdded.addListener(setUninstallURL);
  ewe.subscriptions.onChanged.addListener(async (subscription, property) => {
    if (property !== "enabled") return;

    await setUninstallURL();
  });
  ewe.subscriptions.onRemoved.addListener(setUninstallURL);
}
