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

const LIB_FOLDER = `../${process.env.LIB_FOLDER || "lib"}`;
exports.LIB_FOLDER = LIB_FOLDER;

const fs = require("fs");
const {Module} = require("module");
const path = require("path");

// Load sandboxed-module dynamically instead of using require() so it does not
// have a module.parent
// https://gitlab.com/eyeo/adblockplus/abc/adblockpluscore/-/issues/192
const SandboxedModule = dynamicRequire("sandboxed-module");

const {MILLIS_IN_HOUR} = require(LIB_FOLDER + "/time");

let globals = {
  console,
  process,
  URL
};

let knownModules = new Map();
for (let dir of [path.join(__dirname, "stub-modules"),
                 path.join(__dirname, LIB_FOLDER)]) {
  for (let file of fs.readdirSync(path.resolve(dir))) {
    if (path.extname(file) == ".js") {
      knownModules.set(path.basename(file, ".js"), path.resolve(dir, file));
    }
  }
}

function dynamicRequire(id) {
  let module = new Module(id);
  module.load(require.resolve(id));
  return module.exports;
}

function rewriteRequires(source) {
  function escapeString(str) {
    return str.replace(/(["'\\])/g, "\\$1");
  }

  return source.replace(/(\brequire\(["'])([^"']+)/g, (match, prefix, request) => {
    if (knownModules.has(request)) {
      return prefix + escapeString(knownModules.get(request));
    }
    return match;
  });
}

/**
 * Creates a sandboxed module loader. This is needed if
 * - Modules being tested set global state
 * - Modules being tested require one of the stubs (io, prefs, info)
 * - Modules being tested need to mock time or network requests
 *
 * Tests that don't need the sandbox shouldn't use it.
 * @param {?Object} options Additional options for the sandbox.
 * @param {Object} options.globals Additional global variables to override in
 *   the sandbox.
 * @returns {function} Require function to load modules in the sandbox.
 */
exports.createSandbox = function(options) {
  if (!options) {
    options = {};
  }

  let sourceTransformers = [rewriteRequires];

  // This module loads itself into a sandbox, keeping track of the require
  // function which can be used to load further modules into the sandbox.
  return SandboxedModule.require("./_sandbox.js", {
    globals: Object.assign({}, globals, options.globals),
    sourceTransformers
  }).require;
};

exports.setupTimerAndFetch = function() {
  let currentTime = 100000 * MILLIS_IN_HOUR;
  let startTime = currentTime;

  let fakeTimer = {
    callback: null,
    delay: -1,
    nextExecution: 0,

    setTimeout(callback, delay) {
      // The fake timer implementation is a holdover from the legacy extension.
      // Due to the way it works, it is safer to allow only one callback at a
      // time.
      // https://gitlab.com/eyeo/adblockplus/abc/adblockpluscore/issues/43
      if (this.callback && callback != this.callback) {
        throw new Error("Only one timer callback supported");
      }

      this.callback = callback;
      this.delay = delay;
      this.nextExecution = currentTime + delay;
      return 1;
    },

    clearTimeout() {
      this.callback = null;
      this.delay = -1;
      this.nextExecution = 0;
    },

    trigger() {
      if (currentTime < this.nextExecution) {
        currentTime = this.nextExecution;
      }
      try {
        this.callback();
      }
      finally {
        this.nextExecution = currentTime + this.delay;
      }
    }
  };

  let requests = [];

  async function fetch(url, initObj = {method: "GET"}) {
    // Add a dummy resolved promise.
    requests.push(Promise.resolve());

    let urlObj = new URL(url, "https://example.com");

    let result = [404, ""];

    if (urlObj.protocol == "data:") {
      let data = decodeURIComponent(urlObj.pathname.replace(/^[^,]+,/, ""));
      result = [200, data];
    }
    else if (urlObj.pathname in fetch.requestHandlers) {
      result = fetch.requestHandlers[urlObj.pathname]({
        method: initObj.method,
        path: urlObj.pathname,
        queryString: urlObj.search.substring(1),
        query: urlObj.searchParams
      });
    }

    let [status, text = "", headers = {}] = result;

    if (status == 0) {
      throw new Error("Fetch error");
    }

    if (status == 301) {
      return fetch(headers["Location"], initObj);
    }

    return {status, url: urlObj.href, text: async() => text,
            headers: new Map([["Date", "Thu, 07 Jan 2021 10:05:28 GMT"]])};
  }

  fetch.requestHandlers = {};
  this.registerHandler = (requestPath, handler) => {
    fetch.requestHandlers[requestPath] = handler;
  };

  async function waitForRequests() {
    if (requests.length == 0) {
      return;
    }

    let result = Promise.all(requests);
    requests = [];

    try {
      await result;
    }
    catch (error) {
      console.error(error);
    }

    await waitForRequests();
  }

  async function runScheduledTasks(maxMillis) {
    let endTime = currentTime + maxMillis;

    if (fakeTimer.nextExecution < 0 || fakeTimer.nextExecution > endTime) {
      currentTime = endTime;
      return;
    }

    fakeTimer.trigger();

    await waitForRequests();
    await runScheduledTasks(endTime - currentTime);
  }

  this.runScheduledTasks = async(maxHours, initial = 0, skip = 0) => {
    if (typeof maxHours != "number") {
      throw new Error("Numerical parameter expected");
    }

    startTime = currentTime;

    if (initial >= 0) {
      maxHours -= initial;
      await runScheduledTasks(initial * MILLIS_IN_HOUR);
    }

    if (skip >= 0) {
      maxHours -= skip;
      currentTime += skip * MILLIS_IN_HOUR;
    }

    await runScheduledTasks(maxHours * MILLIS_IN_HOUR);
  };

  this.getTimeOffset = () => (currentTime - startTime) / MILLIS_IN_HOUR;
  Object.defineProperty(this, "currentTime", {
    get: () => currentTime
  });

  return {
    setTimeout: fakeTimer.setTimeout.bind(fakeTimer),
    clearTimeout: fakeTimer.clearTimeout.bind(fakeTimer),
    fetch,
    Date: Object.assign(
      // eslint-disable-next-line prefer-arrow-callback, mocha/prefer-arrow-callback
      function(...args) {
        return new Date(...args);
      },
      {
        now: () => currentTime
      }
    )
  };
};

exports.setupRandomResult = function() {
  let randomResult = 0.5;
  Object.defineProperty(this, "randomResult", {
    get() {
      return randomResult;
    },
    set(value) {
      randomResult = value;
    }
  });

  return {
    Math: Object.create(Math, {
      random: {
        value: () => randomResult
      }
    })
  };
};

exports.unexpectedError = function(error) {
  console.error(error);
  this.ifError(error);
};