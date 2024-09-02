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

export function findUrl(driver, expectedUrl, timeout = 5000) {
  return driver.wait(
    async () => {
      for (const handle of await driver.getAllWindowHandles()) {
        await driver.switchTo().window(handle);
        const url = await driver.getCurrentUrl();
        if (url.includes(expectedUrl)) {
          return true;
        }
      }
    },
    timeout,
    `${expectedUrl} was not found`,
  );
}
