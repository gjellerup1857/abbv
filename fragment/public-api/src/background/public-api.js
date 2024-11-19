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

import { start as startStatusAPI } from "./status-api.js";
import { start as startAllowlistingAPI } from "./allowlisting-api.js";
import { start as startMainWorldAPIInjection } from "./api-injector.js";

/**
 * @typedef {Object} StartParams
 * @property {any} ewe The filter engine.
 * @property {any} port A reference to the port object
 * @property {addTrustedMessageTypesFunction} addTrustedMessageTypes Function to add the trusted message types
 * @property {Function} isPremiumActive Function to get the premium state of the user
 * @property {Function} getEncodedLicense Function to get the encoded license of the user
 */

/**
 * A callback function that modifies the allowlist for a tab.
 *
 * @callback addTrustedMessageTypesFunction
 * @param {string} origin - The origin of the message.
 * @param {string[]} types - The message types to be trusted.
 */

/**
 * Initializes the Public API fragment.
 *
 * @param {StartParams} StartParams The start parameters
 */
export function start({
  ewe,
  port,
  addTrustedMessageTypes,
  isPremiumActive,
  getEncodedLicense,
}) {
  startStatusAPI({
    ewe,
    port,
    addTrustedMessageTypes,
    isPremiumActive,
    getEncodedLicense,
  });
  startAllowlistingAPI({
    port,
    addTrustedMessageTypes,
  });
  startMainWorldAPIInjection();
}
