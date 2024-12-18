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

import {
  type Licensing,
  type Logger,
  type Preferences,
  type UserAndHostInformation,
} from "./context.types";

export let prefs: Preferences = {
  get(_): any {
    return null;
  },
  async set(_key, _value) {},
  on(_pref, _callback) {},

  untilLoaded: Promise.resolve(),
};

export let logger: Logger = {
  debug(_) {},
  error(_) {},
};

export let licensing: Licensing = {
  isLicenseValid() {
    return false;
  },
};

export let info: UserAndHostInformation = {
  async getId() {
    return "";
  },
  getAppName() {
    return "app_name";
  },
  getBrowserName() {
    return "browser_name";
  },
  getAppVersion() {
    return "app_version";
  },
};

export function init(
  prefs_: Preferences,
  logger_: Logger,
  licensing_: Licensing,
  info_: UserAndHostInformation,
): void {
  prefs = prefs_;
  logger = logger_;
  licensing = licensing_;
  info = info_;
}
