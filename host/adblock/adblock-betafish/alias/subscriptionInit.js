/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2013-present  Adblock, Inc.
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

/** @module adblock-betafish/alias/subscriptionInit */

/** similar to adblockpluschrome\lib\subscriptionInit.js */

/** @module subscriptionInit */

import { Prefs } from './prefs';
import * as info from 'info';
import * as ewe from "@eyeo/webext-ad-filtering-solution";
import rulesIndex from "@adblockinc/rules/adblock";
import { port } from "../../adblockplusui/adblockpluschrome/lib/messaging/port.js";
import { setReadyState, ReadyState } from "../../adblock-betafish/testing/ready-state/background/index.ts";


let firstRun;
let reinitialized = false;
let dataCorrupted = false;

/**
 * If there aren't any filters, the default subscriptions are added.
 * However, if patterns.ini already did exist and/or any preference
 * is set to a non-default value, this indicates that this isn't the
 * first run, but something went wrong.
 *
 * This function detects the first run, and makes sure that the user
 * gets notified (on the first run page) if the data appears incomplete
 * and therefore will be reinitialized.
 */
async function detectFirstRun(foundSubscriptions, foundStorage) {
  let userFilters = await ewe.filters.getUserFilters();
  firstRun = !foundSubscriptions && !userFilters.length;

  if (firstRun && (foundStorage || Prefs.currentVersion))
    reinitialized = true;

  Prefs.currentVersion = info.addonVersion;
}

/**
 * In case of data corruption, we don't want to show users
 * any non-essential notifications so we need to instruct
 * the notification manager to ignore them.
 *
 * @param {boolean} value
 */
function setDataCorrupted(value) {
  dataCorrupted = value;
  ewe.notifications.ignored = value;
}

/*
 * Remove any subscriptions that a user or administrator has added to a
 * central / common configuration (such as the Windows Registry)
 *
 * @return {Promise}
 */

function removeSubscriptions() {
  return new Promise(function (resolve, reject) {
    if ("managed" in browser.storage) {
      browser.storage.managed.get(null).then(
        async (items) => {
          for (let key in items) {
            if (key === "remove_subscriptions" && Array.isArray(items[key]) && items[key].length) {
              for (let inx = 0; inx < items[key].length; inx++) {
                await ewe.subscriptions.remove(items[key][inx]);
              }
            }
          }
          resolve();
        },

        // Opera doesn't support browser.storage.managed, but instead of simply
        // removing the API, it gives an asynchronous error which we ignore here.
        () => {
          resolve();
        }
      );
    } else {
      resolve();
    }
  });
}


async function addSubscriptions() {
  if (firstRun || reinitialized) {
    await ewe.subscriptions.addDefaults();
  }
  // Remove "acceptable ads" if Gecko
  if (firstRun) {
    for (let url of Prefs.additional_subscriptions) {
      try {
        await ewe.subscriptions.add(url);
      }
      catch (ex) {
        console.error(`Failed to add additional subscription: ${url}`);
      }
    }
    if (info.platform === "gecko") {
      try {
        await ewe.subscriptions.remove(ewe.subscriptions.ACCEPTABLE_ADS_URL);
      }
      catch (ex) {
        console.error(`Failed to remove AA subscription`);
      }
    }
  }
}

/**
 * We need to check whether we can safely write to/read from storage
 * before we start relying on it for storing preferences.
 */
async function testStorage() {
  let testKey = "readwrite_test";
  let testValue = Math.random();

  try {
    await browser.storage.local.set({ [testKey]: testValue });
    let result = await browser.storage.local.get(testKey);
    if (result[testKey] != testValue)
      throw new Error("Storage test: Failed to read and write value");
  } finally {
    await browser.storage.local.remove(testKey);
  }
}

const start = async function () {

  let addonInfo = {
    bundledSubscriptions: rulesIndex,
    bundledSubscriptionsPath: "/data/rules/abp",
    inlineCss: false,
    name: info.addonName,
    version: info.addonVersion,
  };

  // The following code may need to be updated once the extension engine
  // adds a opt out for eyeometry (https://eyeo.atlassian.net/browse/EE-579)
  if (info.platform !== "gecko") {
    let cdp = {
      pingUrl: webpackDotenvPlugin.ADBLOCK_CDP_PING_URL,
      aggregateUrl: webpackDotenvPlugin.ADBLOCK_CDP_AGGREGATE_URL,
      bearer: webpackDotenvPlugin.ADBLOCK_CDP_BEARER
    };

    if (cdp.pingUrl && cdp.aggregateUrl && cdp.bearer) {
      addonInfo.cdp = cdp;
    }
    let telemetry = {
      url: webpackDotenvPlugin.ADBLOCK_EYEOMETRY_URL,
      bearer: webpackDotenvPlugin.ADBLOCK_EYEOMETRY_BEARER
    }

    if (telemetry.url && telemetry.bearer) {
      addonInfo.telemetry = telemetry;
    }
  }

  return ewe.start(addonInfo).then(async (eweFirstRun) => {
    await detectFirstRun(
      eweFirstRun.foundSubscriptions,
      eweFirstRun.foundStorage
    );
    (await ewe.filters.getMigrationErrors()).forEach(console.error);
    (await ewe.subscriptions.getMigrationErrors()).forEach(console.error);
    eweFirstRun.warnings.forEach(console.warn);
    await Prefs.untilLoaded.catch(() => { setDataCorrupted(true); });
    await testStorage().catch(() => { setDataCorrupted(true); })
    // adding default filter lists
    await addSubscriptions();
    await removeSubscriptions();

    setReadyState(ReadyState.started);
  });
};
const initialize = start();

/**
 * Gets a value indicating whether a data corruption was detected.
 *
 * @return {boolean}
 */
function isDataCorrupted() {
  return dataCorrupted;
}

export { initialize, isDataCorrupted };


/**
 * @typedef {object} subscriptionsGetInitIssuesResult
 * @property {boolean} dataCorrupted
 *   true if it appears that the user's extension data was corrupted.
 * @property {boolean} reinitialized
 *   true if we have reset the user's settings due to data corruption.
 */

/**
 * Returns an Object with boolean flags for any subscription initialization
 * issues.
 *
 * @event "subscriptions.getInitIssues"
 * @returns {subscriptionsGetInitIssuesResult}
 */
port.on("subscriptions.getInitIssues", (message, sender) => ({ dataCorrupted, reinitialized }));
