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

import { MILLIS_IN_DAY } from "../../shared/constants.js";

/**
 * Verifies if the expiration timestamp is valid
 *
 * @param {number} expiresAt - The expiration timestamp.
 * @returns {boolean}
 */
function verifyExpiresAt(expiresAt) {
  if (!Number.isInteger(expiresAt)) {
    throw new Error("Expiration must be an integer.");
  }

  const now = Date.now();
  const minExpiresAt = now + MILLIS_IN_DAY;
  const maxExpiresAt = now + 365 * MILLIS_IN_DAY;

  if (expiresAt < minExpiresAt || expiresAt > maxExpiresAt) {
    throw new Error("Expiration must be between 1 and 365 days from now.");
  }

  return true;
}

/**
 * Handles the allowlisting of a website.
 *
 * @param {Object} params - Input parameter
 * @param {Number} [params.expiresAt] - The expiration timestamp in milliseconds.
 *    Must be between 1 and 365 days from now.
 * @returns {Promise<Object>} - The metadata result of the allowlisting command
 */
export async function allowlistWebsite({ expiresAt } = {}) {
  const metadata = {
    origin: "web",
    created: Date.now(),
  };

  if (expiresAt && verifyExpiresAt(expiresAt)) {
    metadata.expiresAt = expiresAt;
  }

  const parsedUrl = new URL(this.sender.tab.url);
  await this.ewe.filters.add([`@@||${parsedUrl.hostname}^$document`], metadata);

  return {
    ...metadata,
    status: true,
  };
}
