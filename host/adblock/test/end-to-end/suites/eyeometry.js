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

async function getStorage(driver, storage, key) {
  return driver.executeAsyncScript(async (params, callback) => {
    browser.storage[params.storage].get([params.key])
      .then(result => callback(result[params.key]));
  }, { storage, key });
}

export default () => {
  const timeout = 10000;

  it("sends the request not in Firefox", async function() {
    const { driver, browserName } = this;
    if (browserName === "firefox") {
      this.skip();
    }

    const timeoutMsg = `No storage data after ${timeout}ms`;
    const data = await driver.wait(
      async () => {
        return getStorage(driver, "local", "ewe:telemetry");
      },
      timeout,
      timeoutMsg,
    );

    expect(data).toEqual(expect.objectContaining({
      firstPing: expect.any(String),
      lastPing: expect.any(String),
      lastPingTag: expect.any(String)
    }));
  });

  it("does not send the request in Firefox", async function () {
    const { driver, browserName } = this;
    if (browserName !== "firefox") {
      this.skip();
    }

    const timeoutMsg = `Storage data found after ${timeout}ms`;
    let data;

    try {
      await driver.wait(
        async () => {
          return getStorage(driver, "local", "ewe:telemetry");
        },
        timeout,
        timeoutMsg,
      );
    } catch (e) {
      // Timeout exceeded, no telemetry data saved, all good
      return;
    }

    expect(data).to.equal(null);
  });
};
