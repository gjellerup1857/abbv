/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2024-present  Adblock, Inc.
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

/* eslint-env webextensions, serviceworker */

"use strict";

// Timeout needed by Firefox. Without it the helper extension is not able to
// open the options page
setTimeout(() => {
  chrome.management.getAll((extensions) => {
    for (const extension of extensions) {
      if (
        extension.type == "extension" &&
        extension.installType == "development" &&
        extension.id != chrome.runtime.id &&
        extension.name != "Chrome Automation Extension"
      ) {
        chrome.tabs.create({ url: extension.optionsUrl });
      }
    }
  });
}, 1000);
