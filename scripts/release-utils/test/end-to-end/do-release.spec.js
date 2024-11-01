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

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import url from "url";
import { executeGitCommand } from "../../utils.js";

async function findNodeModules(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodeModulesDirs = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') {
        nodeModulesDirs.push(fullPath);
      } else {
        nodeModulesDirs.push(...await findNodeModules(fullPath));
      }
    }
  }

  return nodeModulesDirs;
}

describe("Do-release script", function() {
  let tempDir;
  let originDir;
  let checkoutDir;

  beforeAll(async function() {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "do-release-spec-"));
    originDir = path.join(tempDir, "origin");
    checkoutDir = path.join(tempDir, "checkout");

    const scriptDir = path.dirname(url.fileURLToPath(import.meta.url));
    const repoRoot =  path.join(scriptDir, "..", "..", "..", "..");
    await fs.cp(repoRoot, originDir, { recursive: true });
    await executeGitCommand("git add --all", originDir);
    await executeGitCommand("git commit -m WIP", originDir);

    await executeGitCommand("git clone origin checkout", tempDir);

    const nodeModulesDirs = await findNodeModules(originDir);
    for (const dir of nodeModulesDirs) {
      const relativePath = path.relative(originDir, dir);
      const targetPath = path.join(checkoutDir, relativePath);
      await fs.symlink(dir, targetPath);
    }
  }, 0);

  afterAll(async function() {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("works", async function() {
    await executeGitCommand("npm run do-release adblock 1.2.3 main", checkoutDir);
  });
});
