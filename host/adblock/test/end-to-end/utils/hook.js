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

import { installUrl } from "./page.js";
import { openNewTab } from "./driver.js";

let optionsHandle;
export function setOptionsHandle(handle) {
  optionsHandle = handle;
}
export function getOptionsHandle() {
  return optionsHandle;
}

async function cleanupOpenTabs() {
  for (const handle of await driver.getAllWindowHandles()) {
    await driver.switchTo().window(handle);

    let url = "";
    try {
      url = await driver.getCurrentUrl();
    } catch (e) {}

    if (handle !== optionsHandle && !url.includes(installUrl)) {
      driver.close();
    }
  }
}

export async function beforeEachTasks() {
  // If the options page handle is not valid anymore, then restore it
  try {
    await driver.switchTo().window(optionsHandle);
  } catch (e) {
    await openNewTab(`${extension.origin}/options.html`);
    optionsHandle = await driver.getWindowHandle();
  }

  await cleanupOpenTabs();
  await driver.switchTo().window(optionsHandle);
}
