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

/** @module subscriptionInit */

import rulesIndex from "@adblockinc/rules/adblockplus";
import * as ewe from "@eyeo/webext-ad-filtering-solution";

import {
  startTelemetry,
  initializeCDP,
  initializeEyeometryMACCounting
} from "@eyeo-fragments/ipm/background";
import * as premium from "../../src/premium/background/index.ts";
import { startOptionLinkListener } from "../../src/options/background";
import { info } from "../../src/info/background";
import {
  setReadyState,
  ReadyState
} from "../../src/testing/ready-state/background/index.ts";
import { port } from "~/core/messaging/background";
import { revalidateAllowlistingStates } from "./allowlisting.js";
import { initDisabledFilterCounters } from "./filterConfiguration.js";
import { initNotifications } from "./notificationHelper.js";
import { Prefs } from "./prefs.js";
import { start as startUnloadCleanup } from "../../src/unload-cleanup/background/index.ts";
import { start as startIPMPingListener } from "../../src/testing/ping-ipm/background";
import {
  hasSchedule,
  ScheduleType,
  setListener,
  setSchedule
} from "~/core/scheduled-event-emitter/background";

let firstRun;
let userNotificationCallback = null;
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
 *
 * @param {boolean} foundSubscriptions
 * @param {boolean} foundStorage
 *
 * @return {Promise}
 */
async function detectFirstRun(foundSubscriptions, foundStorage) {
  let userFilters = await ewe.filters.getUserFilters();
  firstRun = !foundSubscriptions && !userFilters.length;

  if (firstRun && (foundStorage || Prefs.currentVersion)) reinitialized = true;

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

async function addSubscriptionsAndNotifyUser() {
  if (firstRun || reinitialized) await ewe.subscriptions.addDefaults();

  // Attempt to fix the issue where the user has no subscriptions we expect
  // them to have at least the default subscriptions.
  // See: https://eyeo.atlassian.net/browse/EXT-375
  const isMV3 = browser.runtime.getManifest().manifest_version === 3;
  if (isMV3) {
    const subscriptions = await ewe.subscriptions.getSubscriptions();
    if (subscriptions.length === 0) {
      // Enable default subscriptions: EasyList, Anti-CV and Acceptable Ads
      await ewe.subscriptions.addDefaults(null, true);

      // send a message to the log server with debug metadata
      console.warn("Something is wrong with subscriptions, reset to defaults", {
        firstRun,
        reinitialized,
        dataCorrupted
      });

      // reset the reinitialized flag to be later used in communicating
      // with the user
      reinitialized = true;
    }
  }

  for (let url of Prefs.additional_subscriptions) {
    try {
      await ewe.subscriptions.add(url);
      await ewe.subscriptions.sync(url);
    } catch (ex) {
      console.error(`Failed to add additional subscription: ${url}`);
    }
  }

  if (userNotificationCallback)
    userNotificationCallback({ dataCorrupted, firstRun, reinitialized });
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

function initElementHidingDebugMode() {
  Prefs.on("elemhide_debug", () => {
    void ewe.debugging.setElementHidingDebugMode(Prefs.elemhide_debug);
  });

  void ewe.debugging.setElementHidingDebugMode(Prefs.elemhide_debug);
  void ewe.debugging.setElementHidingDebugStyle(
    [
      ["background", "#e67370"],
      ["outline", "solid #f00"]
    ],
    [
      [
        "background",
        `
        repeating-linear-gradient(
          to bottom,
          #e67370 0,
          #e67370 9px,
          #fff 9px,
          #fff 10px
        )
      `
      ],
      ["outline", "solid #f00"]
    ]
  );
}

export async function start() {
  let addonInfo = {
    bundledSubscriptions: rulesIndex,
    bundledSubscriptionsPath: "/data/rules/abp",
    name: info.addonName,
    version: info.addonVersion,
    experiments: {
      url: "https://easylist-downloads.adblockplus.org/ab-testing/experiments.json"
    },
    featureFlags: {
      inlineCss: false
    }
  };

  let cdp = {
    pingUrl: webpackDotenvPlugin.CDP_PING_URL,
    publicKeyUrl: webpackDotenvPlugin.CDP_PUBLIC_KEY_URL,
    bearer: webpackDotenvPlugin.CDP_BEARER
  };
  if (cdp.pingUrl && cdp.publicKeyUrl && cdp.bearer) addonInfo.cdp = cdp;

  let telemetry = {
    url: webpackDotenvPlugin.EYEOMETRY_URL,
    bearer: webpackDotenvPlugin.EYEOMETRY_BEARER
  };

  if (telemetry.url && telemetry.bearer) addonInfo.telemetry = telemetry;

  const [eweFirstRun] = await Promise.all([
    ewe.start(addonInfo),
    Prefs.untilLoaded.catch(() => {
      setDataCorrupted(true);
    }),
    testStorage().catch(() => {
      setDataCorrupted(true);
    })
  ]);

  (await ewe.filters.getMigrationErrors()).forEach(console.error);
  (await ewe.subscriptions.getMigrationErrors()).forEach(console.error);
  eweFirstRun.warnings.forEach(console.warn);
  await detectFirstRun(
    eweFirstRun.foundSubscriptions,
    eweFirstRun.foundStorage
  );
  await addSubscriptionsAndNotifyUser();
  revalidateAllowlistingStates();

  // We have to require the "uninstall" module on demand,
  // as the "uninstall" module in turn requires this module.
  await (await import("./uninstall.js")).setUninstallURL();

  await initDisabledFilterCounters();
  initElementHidingDebugMode();
  await initNotifications(firstRun);
  premium.start();
  startOptionLinkListener();
  void startTelemetry({
    async setListener(scheduleName, f) {
      setListener(scheduleName, f);
    },
    hasSchedule(scheduleName) {
      return hasSchedule(scheduleName);
    },
    setOneShotSchedule(scheduleName, interval) {
      return setSchedule(scheduleName, interval, ScheduleType.interval);
    }
  });
  void initializeCDP();
  void initializeEyeometryMACCounting();
  startUnloadCleanup();
  startIPMPingListener();
  setReadyState(ReadyState.started);

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
  port.on("subscriptions.getInitIssues", (message, sender) => ({
    dataCorrupted,
    reinitialized
  }));
}

/**
 * Gets a value indicating whether a data corruption was detected.
 *
 * @return {boolean}
 */
export function isDataCorrupted() {
  return dataCorrupted;
}

/**
 * Sets a callback that is called with environment information after
 * initialization to notify users.
 *
 * @param {function} callback
 */
export function setNotifyUserCallback(callback) {
  userNotificationCallback = callback;
}
