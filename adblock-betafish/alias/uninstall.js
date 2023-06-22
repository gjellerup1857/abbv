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

import { Prefs } from './prefs';
import SubscriptionAdapter from '../subscriptionadapter';
import { getUserId } from '../id/background/index';

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
    filter => filter.type === 'allowing' && filter.enabled,
  );

  // collect the origin from the metadata
  const filtersMetadata = await Promise.all(
    filters.map(async (rule) => {
      const metadata = await ewe.filters.getMetadata(rule.text)
        .catch(() => null);
      return metadata && metadata.origin;
    }),
  );

  // count the ones that originated in the web
  return filtersMetadata.filter(data => data === 'web').length;
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
        const data = await browser.storage.local.get('blockage_stats');
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
