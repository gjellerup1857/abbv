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
const GeneralPage = require("../page-objects/general.page");
const {executeAsyncScript, getStorage} = require("../helpers");

function removeAllFiltersFromABP() {
  return browser.executeAsync(async callback => {
    const filters = await browser.runtime.sendMessage({ type: "filters.get" });
    await Promise.all(filters.map(filter => browser.runtime.sendMessage(
      { type: "filters.remove", text: filter.text }
    )));

    callback();
  });
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

    // const generalPage = new GeneralPage(browser);

    await removeAllFiltersFromABP();
    return;

    try
    {
      await browser.waitUntil(async() =>
      {
        // const key = "ewe:telemetry";
        const key = "pref:sentry_user_id";
        /*
        data = await browser.executeAsync(async callback =>
        {
          callback("hello");
          // chrome.storage.local.get([key]).then(result => callback(result));

          // const result = await browser.runtime.sendMessage({
          //   type: "testing.storage.get",
          //   storage: "local",
          //   key
          // });
          // callback(result);
        });
        */
        data = await getStorage("local", key);

        // 1
        // data = await executeAsyncScript("return chrome");
        // data = await executeAsyncScript("return browser.runtime.sendMessage(" +
        //   `{type: 'testing.storage.get', storage: 'local', key: '${key}' })`);

        // 2
        // data = await browser.executeScript(`
        //   return new Promise((resolve, reject) => {
        //     chrome.runtime.sendMessage({ type: "testing.storage.get",
        //       storage: "local", key: "${key}" }, response => {
        //       if (browser.runtime.lastError) {
        //         reject(browser.runtime.lastError);
        //       } else {
        //         resolve(response);
        //       }
        //     });
        //   });
        // `, []);

        // if (data)
        //   data = data[key];

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
      console.error("ERROR >>>>>", e.message);

      if (!isFirefox())
      {
        throw e;
      }
      else
      {
        // It's Firefox and no storage data was saved, all good
        // return;
      }
    }

    console.warn("Data", data);

    expect(data).toEqual(expect.objectContaining({
      firstPing: expect.any(String),
      lastPing: expect.any(String),
      lastPingTag: expect.any(String)
    }));
  });
});
