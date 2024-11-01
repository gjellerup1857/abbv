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

const {expect} = require("chai");
const {isFirefox} = require("../helpers");

it("sends telemetry request and saves the data in the storage", async function()
{
  const timeout = 10000;
  const timeoutMsg = `No storage data after ${timeout}ms`;
  let data;

  try
  {
    await browser.waitUntil(async() =>
    {
      const key = "ewe:telemetry";
      data = await browser.executeScript(`
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([\"${key}\"]).then((response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `, []);
      if (data)
        data = data[key];
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

  expect(data).toEqual(expect.objectContaining({
    firstPing: expect.any(String),
    lastPing: expect.any(String),
    lastPingTag: expect.any(String)
  }));
});
