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

import { getFromStorage } from "@eyeo/test-utils/driver";

export default () => {
  // 10 seconds is a safe number to assume telemetry is not enabled
  const timeout = 10000;

  // Eyeometry tests require eyeometry credentials filled in .env
  before(function () {
    if (!process.env.EYEOMETRY_BEARER) {
      // CI run
      if (process.env.CI === "true") {
        throw new Error("EYEOMETRY_BEARER environment variable is missing");
      }

      // Local run
      console.warn("Eyeometry tests are skipped because EYEOMETRY_BEARER is missing");
      this.skip();
    }
  });

  it("sends the request in Chrome and Edge", async function () {
    if (browserDetails.browserName === "firefox") {
      this.skip();
    }

    const data = await driver.wait(
      async () => getFromStorage("local", "ewe:telemetry"),
      timeout,
      `No storage data found after ${timeout}ms`,
    );

    expect(data).toEqual(
      expect.objectContaining({
        firstPing: expect.any(String),
        lastPing: expect.any(String),
        lastPingTag: expect.any(String),
        ucid: expect.any(String),
      }),
    );
  });

  it("does not send the request in Firefox", async function () {
    if (browserDetails.browserName !== "firefox") {
      this.skip();
    }

    let data;
    try {
      data = await driver.wait(async () => getFromStorage("local", "ewe:telemetry"), timeout);
    } catch (err) {
      if (err.name === "TimeoutError") {
        // Timeout exceeded, no telemetry data saved, all good
        return;
      }

      throw err;
    }

    // In case getFromStorage doesn't timeout, at least data should be null
    expect(data).to.equal(null);
  });
};
