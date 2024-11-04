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

import { readFile, executeShellCommand, getCurrentFileDir } from "../../utils.js";

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

async function loadTestFile(relativePath) {
  return await readFile(path.join(getCurrentFileDir(import.meta.url), relativePath));
}

describe("Do-release script", function() {
  let tempDir;
  let originDir;
  let checkoutDir;

  beforeAll(async function() {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "do-release-spec-"));
    originDir = path.join(tempDir, "origin");
    checkoutDir = path.join(tempDir, "checkout");

    const scriptDir = getCurrentFileDir(import.meta.url);
    const repoRoot =  path.join(scriptDir, "..", "..", "..", "..");

    // TODO: This would take much less time if it respected the .gitignore
    // file. That would just mean symlinking the node_modules from the project
    // dir, not the copy.
    await fs.cp(repoRoot, originDir, { recursive: true });

    // This commit is so that any uncommitted changes to the do-release script
    // are included in the checkout, and so are used in the test run.
    await executeShellCommand("git add --all", originDir);        
    await executeShellCommand("git commit -m WIP --allow-empty", originDir);
    
    await executeShellCommand("git clone origin checkout", tempDir);

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

  it("recreates the 4.9 release for adblockplus", async function() {
    await executeShellCommand("npm run do-release -- adblockplus 99.4.9 01debaf19 --yes --release-date=2024-10-31", checkoutDir);

    let diff = await executeShellCommand("git diff --unified=0 HEAD^..HEAD", checkoutDir);
    let expectedDiff = await loadTestFile("adblockplus-99.4.9-diff.txt");
    expect(diff).toEqual(expectedDiff);
  });
});
