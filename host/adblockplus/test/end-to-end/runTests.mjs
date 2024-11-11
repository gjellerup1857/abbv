/* eslint-disable quote-props */
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

/* eslint-disable no-console */

import { spawn } from "child_process";
import { runTestServer, killTestServer } from "@eyeo/test-utils";

// Extract command-line arguments after the script name
// e.g., --suite filterlists
const args = process.argv.slice(2);

async function runWdioTests(config) {
  return new Promise((resolve, reject) => {
    const wdioProcess = spawn(
      "wdio",
      ["run", config.filename, ...config.args],
      { stdio: "inherit" }
    );

    wdioProcess.on("close", (code) => {
      code === 0
        ? resolve()
        : reject(new Error(`wdio exited with code ${code}`));
    });
  });
}

async function runMochaTests() {
  return new Promise((resolve, reject) => {
    const mochaProcess = spawn(
      "mocha",
      // Add the "--paralle" flag to run tests in parallel.
      // Ensure the real-time logging can work in parallel before doing that and
      // the CI server can handle the increased load.
      ["runners/runner.*.mjs", "--timeout", "150000", ...args],
      { stdio: "inherit" }
    );

    mochaProcess.on("close", (code) => {
      code === 0
        ? resolve()
        : reject(new Error(`Mocha exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("Starting test server...");
  await runTestServer();

  try {
    // Run two WDIO processes with different config files in parallel
    const configs = [{ filename: "local-test.conf.mjs", args }];

    for (const config of configs) {
      console.log(`Running tests with ${config.filename}...`, config);
      await runWdioTests(config);
    }

    // Run Mocha tests
    await runMochaTests();
  } finally {
    console.log("Stopping test server...");
    await killTestServer();
  }
}

main().catch((error) => {
  console.error("Error running tests:", error);
  process.exit(1);
});
