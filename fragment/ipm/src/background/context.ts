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

import { Context } from "./context.types";

/**
 * Temporary preferences store, just for testing purposes
 */
const prefs: { [key: string]: any } = {};

export const context: Context = {
  // Prefs
  untilPreferencesLoaded: async () => { },
  getPreference: (key) => { return prefs[key]; },
  setPreference: async (key, value) => { prefs[key] = value; },
  onPreferenceChanged: (_key, _f) => { },

  // Logger
  logDebug: (...args: any[]) => { console.debug(args); },
  logError: (...args: any[]) => { console.error(args); },

  // Licenses and Premium
  isLicenseValid: () => { return false; },

  // User or Installation Id
  getId: async (): Promise<string> => { return "42"; },

  // Host information
  getAppName: () => { return "info.baseName"; },
  getBrowserName: () => { return "info.application"; },
  getAppVersion: () => { return "info.addonVersion"; },
}
