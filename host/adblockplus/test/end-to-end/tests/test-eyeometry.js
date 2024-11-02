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

"use strict";

const {isFirefox, beforeSequence, afterSequence} = require("../helpers");

async function getStorage(storage, key)
{
  return browser.executeAsync(async(params, callback) =>
  {
    browser.storage[params.storage].get([params.key])
      .then(result => callback(result[params.key]));
  }, {storage, key});
}

describe("Eyeometry", function()
{
  before(async function()
  {
    await beforeSequence();
  });

  after(async function()
  {
    await afterSequence();
  });

  const timeout = 10000;

  it("sends the request not in Firefox", async function()
  {
    if (isFirefox())
      this.skip();

    const timeoutMsg = `No storage data after ${timeout}ms`;
    let data;

    await browser.waitUntil(
      async() =>
      {
        data = await getStorage("local", "ewe:telemetry");
        if (data)
          return true;
      },
      {
        timeout,
        interval: 100,
        timeoutMsg
      });

    expect(data).toEqual(expect.objectContaining({
      firstPing: expect.any(String),
      lastPing: expect.any(String),
      lastPingTag: expect.any(String)
    }));
  });

  it("does not send the request in Firefox", async function()
  {
    if (!isFirefox())
      this.skip();

    const timeoutMsg = `Storage data found after ${timeout}ms`;
    let data;

    try
    {
      await browser.waitUntil(
        async() =>
        {
          data = await getStorage("local", "ewe:telemetry");
          if (data)
            return true;
        },
        {
          timeout,
          interval: 100,
          timeoutMsg
        });
    }
    catch (e)
    {
      // Timeout exceeded, no telemetry data saved, all good
      return;
    }

    expect(data).toBeNull();
  });
});
