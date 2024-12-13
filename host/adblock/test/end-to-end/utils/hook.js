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

import { openNewTab } from "@eyeo/test-utils/driver";
import { getOptionsHandle, setOptionsHandle } from "@eyeo/test-utils/extension";
import { installUrl } from "./page.js";

async function cleanupOpenTabs() {
  for (const handle of await driver.getAllWindowHandles()) {
    await driver.switchTo().window(handle);

    let url = "";
    try {
      url = await driver.getCurrentUrl();
    } catch (e) {}

    if (handle !== getOptionsHandle() && !url.includes(installUrl)) {
      driver.close();
    }
  }
}

export async function beforeEachTasks() {
  console.log('before each')
  // If the options page handle is not valid anymore, then restore it
  try {
    await driver.switchTo().window(getOptionsHandle());
  } catch (e) {
    console.log('before each task error', e)
    await openNewTab(`${extension.origin}/options.html`);
    setOptionsHandle(await driver.getWindowHandle());
  }
  console.log('before each 2')

  await cleanupOpenTabs();
  console.log('before each 3')
  await driver.switchTo().window(getOptionsHandle());
  console.log('before each end')
}
