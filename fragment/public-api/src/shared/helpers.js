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

import { adblockName, adblockPlusName } from "./constants.js";

/**
 * Returns the integration name, based on the extension short name
 * taken from the manifest
 *
 * @param {string} manifestShortName The short name taken from the manifest
 * @returns {string} The integration name
 */
export function getIntegrationName(manifestShortName) {
  if (manifestShortName === "AdBlock") {
    return adblockName;
  } else if (manifestShortName === "Adblock Plus") {
    return adblockPlusName;
  }

  throw new Error("Invalid extension name");
}