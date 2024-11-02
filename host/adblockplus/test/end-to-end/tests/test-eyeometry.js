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
      .then(result => callback(result[key]));
  }, {storage, key});
}

describe("Telemetry", function()
{
  before(async function()
  {
    await beforeSequence();
  });

  after(async function()
  {
    await afterSequence();
  });

  it("sends request and saves the data in the storage", async function()
  {
    const timeout = 10000;
    const timeoutMsg = `No storage data after ${timeout}ms`;
    let data;

    try
    {
      await browser.waitUntil(async() =>
      {
        data = await getStorage("local", "ewe:telemetry");
        console.warn("Data", data);

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
      if (!isFirefox())
      {
        throw e;
      }
      else
      {
        // It's Firefox and no storage data was saved, all good
        return;
      }
    }

    if (!isFirefox())
    {
      expect(data).toEqual(expect.objectContaining({
        firstPing: expect.any(String),
        lastPing: expect.any(String),
        lastPingTag: expect.any(String)
      }));
    }
    else
    {
      // on Firefox there should be no telemetry data saved
      expect(true).toEqual(false);
    }
  });
});
