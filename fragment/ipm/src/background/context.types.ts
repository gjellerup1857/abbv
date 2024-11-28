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

/**
 * A interface to capture are the needed external functionalities needed by
 * the IPM system to work. These functionalities are tipically implemented
 * by hosting extensions.
 */
export interface Context {
  // Preferences
  untilPreferencesLoaded: () => Promise<void>;
  getPreference: (key: string) => any;
  setPreference: (key: string, value: any) => Promise<void>;
  onPreferenceChanged: (key: string, f: () => Promise<void>) => void;

  // Logger
  logDebug: (...args: any[]) => void;
  logError: (...args: any[]) => void;

  // Licenses and Premium
  isLicenseValid: () => boolean;

  // User or Installation Id
  getId: () => Promise<string>;

  // Host information
  getAppName: () => string;
  getBrowserName: () => string;
  getAppVersion: () => string;
}
