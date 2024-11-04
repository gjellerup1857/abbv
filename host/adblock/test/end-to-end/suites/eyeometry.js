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

import { expect } from "expect";

async function getStorage(driver) {
  return driver.executeAsyncScript(async (callback) => {
    const data = await browser.storage.local.get(["ewe:telemetry"]);
    callback(data);
  });
}

export default () => {
  // When running test in isolation, extensions needs time to
  // Initialize eyeometry and ewe to set storage data
  const timeout = 4000;

  it("sends the request", async function () {
    // TODO: add information to readme that proper data for testing eyeometry should be filled
    // as env variable - in other scenario - it will fail
    const { driver, browserName } = this;
    let storageData;
    if (browserName !== "firefox") {
      await driver.wait(
        async () => {
          storageData = await getStorage(driver);
          return Object.keys(storageData).length > 0;
        },
        timeout,
        `No storage data after ${timeout}ms`,
        500,
      );

      expect(storageData["ewe:telemetry"]).toEqual(
        expect.objectContaining({
          firstPing: expect.any(String),
          lastPing: expect.any(String),
          lastPingTag: expect.any(String),
        }),
      );
    } else {
      try {
        await driver.wait(
          async () => {
            storageData = await getStorage(driver);
            return Object.keys(storageData).length > 0;
          },
          timeout,
          `No storage data after ${timeout}ms`,
          500,
        );
      } catch (e) {
        // Timeout exceeded, no telemetry data saved, all good
        return;
      }

      expect(storageData).to.equal(null);
    }
  });
};
