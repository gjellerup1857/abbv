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

import argparse from "argparse";
import { pathToFileURL } from "url";
import { execFile as execFileSync } from "child_process";
import { promisify } from "util";
import { EOL } from "os";

const BUILDNUM_OFFSET = 10000;

export async function execFile(...args) {
  const { stdout } = await promisify(execFileSync)(...args);
  return stdout.trim();
}

export async function getBuildnum(revision = "HEAD") {
  let until = await execFile("git", ["log", "--pretty=%ct", "-n1", revision]);

  const buildNumberString = await execFile("git", [
    "rev-list",
    "--count",
    "--until",
    until,
    "origin/main",
    revision,
  ]);
  return BUILDNUM_OFFSET + parseInt(buildNumberString, 10);
}

export async function getCommitHash() {
  return await execFile("git", ["rev-parse", "--short", "HEAD"]);
}

export async function hasTag(tag) {
  const tagsString = await execFile("git", ["tag", "--points-at", "HEAD"]);
  const tags = tagsString.split(EOL);
  return tags.includes(tag);
}

export async function lsFiles(directory) {
  const fileString = await execFile("git", ["ls-files", "--recurse-submodules", directory]);
  return fileString.split(EOL);
}

if (import.meta.url == pathToFileURL(process.argv[1])) {
  let parser = argparse.ArgumentParser();
  parser.addArgument(["-r", "--revision"], { required: false, defaultValue: "HEAD" });
  let args = parser.parseArgs();

  (async () => {
    try {
      console.log(await getBuildnum(args.revision));
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
