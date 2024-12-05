/* eslint-disable */
import { spawn } from "child_process";
import { runTestServer, killTestServer, buildHelperExtension } from "@eyeo/test-utils";

import { removeScreenshots } from "./runners/helpers.js";
import { helperExtensionPath } from "./runners/constants.js";

// Extract command-line arguments after the script name
// e.g., --suite filterlists
const args = process.argv.slice(2);

// Global timeout for test cases. Test cases expected to take longer time to run
// use `this.timeout()` to set an individual higher timeout.
const globalTimeout = 30000;

async function runMochaTests() {
  return new Promise((resolve, reject) => {
    const mochaProcess = spawn(
      "mocha",
      // Add the "--parallel" flag to run tests in parallel.
      // Ensure the real-time logging can work in parallel before doing that and
      // the CI server can handle the increased load.
      ["test/end-to-end/runners/runner.*.js", "--timeout", globalTimeout, ...args],
      { stdio: "inherit" },
    );

    mochaProcess.on("close", (code) => {
      code === 0 ? resolve() : reject(new Error(`Mocha exited with code ${code}`));
    });
  });
}

async function main() {
  await buildHelperExtension(process.env.MANIFEST_VERSION, helperExtensionPath);
  console.log(`Helper extension built to ${helperExtensionPath}`);

  await runTestServer();
  await removeScreenshots();

  try {
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
