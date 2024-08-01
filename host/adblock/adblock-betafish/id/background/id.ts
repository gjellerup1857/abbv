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
import * as browser from "webextension-polyfill";

import { chromeStorageSetHelper } from "../../utilities/background/bg-functions";

const userIdStorageKey = "userid";

/**
 * Generates a 16 character random string
 *
 * @returns the user id as 16 character random string
 */
// eslint-disable-next-line import/prefer-default-export
export async function getUserId(): Promise<string> {
  const response = await browser.storage.local.get(userIdStorageKey);
  let userId = "";
  if (!response[userIdStorageKey]) {
    const timeSuffix = Date.now() % 1e8; // 8 digits from end of
    // timestamp
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    const result = [];
    for (let i = 0; i < 8; i++) {
      const choice = Math.floor(Math.random() * alphabet.length);
      result.push(alphabet[choice]);
    }
    userId = result.join("") + timeSuffix;
    chromeStorageSetHelper(userIdStorageKey, userId);
  } else {
    userId = response[userIdStorageKey];
  }
  return userId;
}
