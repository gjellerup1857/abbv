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

import { describe, expect, it, beforeAll } from "vitest";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

function isRunningInDocker() {
  return existsSync("/.dockerenv");
}

function runInDocker() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const DOCKERFILE_PATH = path.resolve(__dirname, './Dockerfile');
  const DOCKER_CONTEXT = path.resolve(__dirname, '../../../../');

  console.log('Not running in Docker. Building and starting Docker container...');

  execSync(`docker build -t test-container -f ${DOCKERFILE_PATH} ${DOCKER_CONTEXT}`, { stdio: "inherit" });
  try {
    execSync(
      "docker run --rm test-container",
      { stdio: "inherit" }
    );
    return 0;
  }
  catch (e) {
    return e.status;
  }
}

if (!isRunningInDocker()) {
  let exitStatus = runInDocker();
  process.exit(exitStatus);
}

describe("Do-release script", function() {
  it("works", function() {
  });
});
