/*
 * This file is part of Web Extensions Core Utilities (Web Extensions CU),
 * Copyright (C) 2024-present eyeo GmbH
 *
 * Web Extensions CU is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Web Extensions CU is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Web Extensions CU.  If not, see <http://www.gnu.org/licenses/>.
 */

import path from "path";
import fs from "fs";
import {spawn} from "child_process";

import {testPagesPort} from "./test-pages-server.js";

const testPagesUrl = `http://localhost:${testPagesPort}`;

let testServer;

export function runTestServer(verbose) {
  if (testServer) {
    return;
  }

  console.log("Test server starting...");
  // adblock test run happens in the context of host/adblock
  let startServerPath = path.join(process.cwd(), "..", "..", "test-utils", "start-server.js");
  if (!fs.existsSync(startServerPath)) {
    // adblockplus test run happens in the context of host/adblockplus/test/end-to-end
    startServerPath = path.join(process.cwd(), "..", "..", "..", "..", "test-utils", "start-server.js");
  }

  let args = [startServerPath];
  if (verbose) {
    args.push("--verbose");
  }
  testServer = spawn("node", args);

  return new Promise((resolve, reject) => {
    let log = [];
    let testPagesServerStarted = false;
    let skipProcessingOutput = false;

    function removeListeners() {
      testServer.stderr.off("data", onData);
      testServer.stdout.off("data", onData);
      testServer.off("close", onClose);
    }

    function onData(data) {
      if (verbose) {
        for (const line of data.toString().split("\n")) {
          if (line.length > 0) {
            console.log("Server (debug):", line);
          }
        }
      }
      if (skipProcessingOutput) {
        // in verbose mode we're still listening the process output,
        // but skip processing it
        return;
      }
      log.push(data);
      if (data.includes(`listening at ${testPagesUrl}`)) {
        testPagesServerStarted = true;
      }

      if (testPagesServerStarted) {
        console.log("✅ Test server started");
        if (verbose) {
          // keep listening the std output from child process just
          // to be able to forward it to console, but skip processing
          skipProcessingOutput = true;
        }
        else {
          removeListeners();
        }
        resolve();
      }
    }

    function onClose(code) {
      if (code && code != 0) {
        if (!verbose) {
          console.log(log.join("\n"));
        }
        removeListeners();
        reject(new Error("Failed to start test server"));
      }
    }

    testServer.stderr.on("data", onData);
    testServer.stdout.on("data", onData);
    testServer.on("close", onClose);
  });
}

export async function killTestServer() {
  await new Promise((resolve, reject) => {
    let timeout = setTimeout(() => {
      reject(new Error("Could not stop test server"));
    }, 5000);

    function onClose() {
      if (!testServer) {
        return;
      }

      testServer.off("close", onClose);
      console.log("✅ Test server has been stopped");
      resolve();
      clearTimeout(timeout);
    }
    testServer.on("close", onClose);
    testServer.kill("SIGKILL");
  });

  testServer = null;
}
