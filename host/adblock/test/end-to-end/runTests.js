/* eslint-disable */
import { spawn } from "child_process";
import { runTestServer, killTestServer } from "@eyeo/test-utils";

async function runMochaTests() {
  return new Promise((resolve, reject) => {
    const mochaProcess = spawn(
      "mocha",
      // Add the "--paralle" flag to run tests in parallel.
      // Ensure the real-time logging can work in parallel before doing that and
      // the CI server can handle the increased load.
      ["test/end-to-end/runners/runner.*.js", "--timeout", "150000"],
      { stdio: "inherit" },
    );

    mochaProcess.on("close", (code) => {
      code === 0 ? resolve() : reject(new Error(`Mocha exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("Starting test server...");

  await runTestServer();

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
