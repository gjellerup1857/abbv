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

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import ignore from "ignore";

import { readFile, executeShellCommand, getCurrentFileDir, projectRootPath,
       gitRepoHasChanges } from "../../utils.js";

async function loadGitignore() {
  const gitignorePath = path.join(projectRootPath(), '.gitignore');
  const gitignoreContent = await readFile(gitignorePath);

  const ig = ignore();
  ig.add(gitignoreContent);
  return ig;
}

async function recursiveCopyDirectoryWithGitignore(src, dest, ig, rootDir = src) {
  await fs.mkdir(dest, { recursive: true });

  const items = await fs.readdir(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const relativePath = path.relative(rootDir, srcPath);

    if (!ig.ignores(relativePath)) {
      const stats = await fs.stat(srcPath);
      if (stats.isDirectory()) {
        await recursiveCopyDirectoryWithGitignore(srcPath, destPath, ig, rootDir);
      } else if (stats.isFile()) {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

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

async function recursiveSymlinkNodeModules(src, dest) {
  const nodeModulesDirs = await findNodeModules(src);
  for (const dir of nodeModulesDirs) {
    const relativePath = path.relative(src, dir);
    const targetPath = path.join(dest, relativePath);
    await fs.symlink(dir, targetPath);
  }
}

async function loadTestFile(relativePath) {
  return await readFile(path.join(getCurrentFileDir(import.meta.url), relativePath));
}

describe("Do-release script", function() {
  let tempDir;
  let originDir;
  let checkoutDir;

  beforeEach(async function() {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "do-release-spec-"));
    originDir = path.join(tempDir, "origin");
    checkoutDir = path.join(tempDir, "checkout");

    const repoRoot =  projectRootPath();

    await recursiveCopyDirectoryWithGitignore(repoRoot, originDir, await loadGitignore());

    if (await gitRepoHasChanges(originDir)) {
      // This commit is so that any uncommitted changes to the do-release script
      // are included in the checkout, and so are used in the test run.
      await executeShellCommand("git add --all", originDir);
      await executeShellCommand("git commit -m WIP", originDir);
    }
    
    await executeShellCommand("git clone origin checkout", tempDir);
    await recursiveSymlinkNodeModules(repoRoot, checkoutDir);
  });

  afterEach(async function() {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("recreates the 4.9 release for adblockplus", async function() {
    await executeShellCommand("npm run do-release -- adblockplus 99.4.9 01debaf19 --yes --release-date=2024-10-31", checkoutDir);

    const diff = await executeShellCommand("git diff --unified=0 HEAD^..HEAD", checkoutDir);
    const expectedDiff = await loadTestFile("adblockplus-99.4.9-diff.txt");
    expect(diff).toEqual(expectedDiff);

    const newCommit = await executeShellCommand("git rev-parse --short HEAD", checkoutDir);
    const checkoutReleaseBranchCommit = await executeShellCommand("git rev-parse --short adblockplus-release", checkoutDir);
    const originReleaseBranchCommit = await executeShellCommand("git rev-parse --short adblockplus-release", originDir);
    const originTagCommit = await executeShellCommand("git rev-parse --short adblockplus-99.4.9^{commit}", originDir);

    expect(checkoutReleaseBranchCommit).toEqual(newCommit);
    expect(originReleaseBranchCommit).toEqual(newCommit);
    expect(originTagCommit).toEqual(newCommit);
  });

  it("recreates the 6.11.0 release for adblock", async function() {
    await executeShellCommand("npm run do-release -- adblock 99.6.11.0 05a2e33a5 --yes --release-date=2024-10-30", checkoutDir);

    const diff = await executeShellCommand("git diff --unified=0 HEAD^..HEAD", checkoutDir);
    const expectedDiff = await loadTestFile("adblock-99.6.11.0-diff.txt");
    expect(diff).toEqual(expectedDiff);

    const newCommit = await executeShellCommand("git rev-parse --short HEAD", checkoutDir);
    const checkoutReleaseBranchCommit = await executeShellCommand("git rev-parse --short adblock-release", checkoutDir);
    const originReleaseBranchCommit = await executeShellCommand("git rev-parse --short adblock-release", originDir);
    const originTagCommit = await executeShellCommand("git rev-parse --short adblock-99.6.11.0^{commit}", originDir);

    expect(checkoutReleaseBranchCommit).toEqual(newCommit);
    expect(originReleaseBranchCommit).toEqual(newCommit);
    expect(originTagCommit).toEqual(newCommit);
  });

  it("exits if a version already exists", async function() {
    expect(() => executeShellCommand("npm run do-release -- adblock 6.10.0 HEAD --yes", checkoutDir))
      .rejects.toThrowError("already exists");
  });
});
