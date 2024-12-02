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

/* For ESLint: List any global identifiers used in this file below */
/* global browser, ewe */

/** @module uninstall */
/** similar to adblockpluschrome\lib\uninstall.js */

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { Prefs } from "./prefs";
import SubscriptionAdapter from "../subscriptionadapter";
import { getUserId } from "../id/background/index";
import { getWebAllowlistingFilterCount } from "../telemetry/background/custom-rule";
import { License } from "../picreplacement/check";

async function getPremiumStatus() {
  const hasActiveLicense = License.isActiveLicense();
  return (hasActiveLicense ? "premium" : "free");
}

async function isAcceptableAdsActive() {
  const subs = await ewe.subscriptions.getSubscriptions();
  const privacyUrl = ewe.subscriptions.ACCEPTABLE_ADS_PRIVACY_URL;
  const aaUrl = ewe.subscriptions.ACCEPTABLE_ADS_URL;

  for (const subscription of subs) {
    if ((subscription.url === privacyUrl || subscription.url === aaUrl) &&
        subscription.enabled) {
        return true;
    }
  }
  return false;
}

export async function setUninstallURL() {
  if (browser.runtime.setUninstallURL) {
    const userID = await getUserId();
    let uninstallURL = "https://getadblock.com/uninstall/?u=" + userID;
    // if the start property of blockCount exists (which is the AdBlock
    // installation timestamp)
    // use it to calculate the approximate length of time that user has
    // AdBlock installed
    if (Prefs && Prefs.blocked_total !== undefined) {
      const twoMinutes = 2 * 60 * 1000;
      const getLastUpdateTime = async function () {
        const userSubs = await SubscriptionAdapter.getSubscriptionsMinusText();
        let maxLastDownload = -1;
        for (const sub in userSubs) {
          if (userSubs[sub].lastSuccess > maxLastDownload) {
            maxLastDownload = userSubs[sub].lastSuccess;
          }
        }
        return maxLastDownload;
      };
      const updateUninstallURL = async function () {
        const data = await browser.storage.local.get("blockage_stats");
        let url = uninstallURL;
        if (data && data.blockage_stats && data.blockage_stats.start) {
          const installedDuration = Date.now() - data.blockage_stats.start;
          url = `${url}&t=${installedDuration}`;
        }
        const bc = Prefs.blocked_total;
        url = `${url}&bc=${bc}`;
        const lastUpdateTime = await getLastUpdateTime();
        url = `${url}&lt=${lastUpdateTime}`;
        url += `&wafc=${await getWebAllowlistingFilterCount()}`;
        // CDP data
        url += `&premium_status=${await getPremiumStatus()}`;
        url += `&aa_active=${await isAcceptableAdsActive()}`
        browser.runtime.setUninstallURL(url);
      };
      // start an interval timer that will update the Uninstall URL every 2
      // minutes
      setInterval(updateUninstallURL, twoMinutes);
      updateUninstallURL();
    } else {
      browser.runtime.setUninstallURL(`${uninstallURL}&t=-1`);
    }
  }
}
