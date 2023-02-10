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

/**
 * @overview Migrates existing data from older versions
 */

import * as ewe from '../../../vendor/webext-sdk/dist/ewe-api';

/**
 * Migrates existing user data from older versions
 */
function migrateUserData() {
  // We remove the AdBlock Custom filter list,
  // because it no longer serves any purpose
  const abCustomUrl = 'https://cdn.adblockcdn.com/filters/adblock_custom.txt';
  if (ewe.subscriptions.has(abCustomUrl)) {
    ewe.subscriptions.remove(abCustomUrl);
  }
}

export default {
  migrateUserData,
};
