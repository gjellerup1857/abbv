/* eslint-disable quote-props */
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

import { config as baseConfig } from "./local-base.conf.mjs";

export const config = {
  ...baseConfig

  // For overriding the base config, take care of nested objects.
  // It might be useful to use "deepmerge" utility.
  // https://www.npmjs.com/package/deepmerge
  // https://webdriver.io/docs/organizingsuites/#inherit-from-main-config-file
  // suites: [...],
};
