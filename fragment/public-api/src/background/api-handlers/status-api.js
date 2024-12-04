/**
 * This file is part of eyeo's Public API fragment,
 * Copyright (C) 2024-present eyeo GmbH

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Retrieves the allowlisting status of a tab
 *
 * @param {Object} params - Input parameter
 * @param {number} params.tabId The id of the tab
 * @param {any} params.ewe The filter engine
 * @returns {Promise<any>} The allowlisting state for the current tab
 */
async function getAllowlistStatus({ tabId, ewe }) {
  const allowlistingFilters = await ewe.filters.getAllowingFilters(tabId);
  let metadata = {};

  for (const filter of allowlistingFilters) {
    // eslint-disable-next-line no-await-in-loop
    metadata = await ewe.filters.getMetadata(filter);
    const { origin } = metadata ? metadata : {};

    if (origin === "web") {
      break;
    }
  }

  const { origin, expiresAt } = metadata;

  return {
    status: allowlistingFilters.length > 0,
    origin,
    expiresAt,
  };
}

/**
 * Checks if AA is enabled
 *
 * @param {any} ewe The filter engine
 * @returns {Promise<*>} True if AA is enabled, False otherwise
 */
async function hasAAEnabled({ ewe }) {
  return await ewe.subscriptions.hasAcceptableAdsEnabled();
}

/**
 * Retrieves the extension status
 *
 * @returns {Promise<any>} The extension status info
 */
export async function getStatus() {
  const tabId = this.sender.tab.id;
  const allowlist = await getAllowlistStatus({ tabId, ewe: this.ewe });
  const aa = await hasAAEnabled({ ewe: this.ewe });
  const license = this.isPremiumActive() ? this.getEncodedLicense() : null;

  return {
    license,
    aa,
    allowlist,
  };
}
