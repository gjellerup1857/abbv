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

export {default as base} from "./base.js";
export {default as chrome} from "./chrome.js";
export {default as firefox} from "./firefox.js";
import rulesV2 from "./rules.v2.js";
import rulesV3 from "./rules.v3.js";
export {default as webpack} from "./webpack.config.js";

/**
 * Returns the file mapping configuration for the given manifest version.
 *
 * @param {number} manifestVersion - Manifest version
 * @return {object} File mapping configuration
 */
export function getRulesMapping(manifestVersion)
{
  const rules = (manifestVersion === 2) ? rulesV2 : rulesV3;
  return rules.mapping;
}
