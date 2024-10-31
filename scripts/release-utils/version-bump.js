#!/usr/bin/env node
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

import {ReleaseNotes} from "./releaseNotes.js";

async function run() {
  const host = process.argv[2];
  const version = process.argv[3];
  const commit = process.argv[4];

  // TODO: Dry-run parameter, updates the branch being pushed to and tag format

  if (!host || !version) {
    console.error('Please provide a host, version and commit to release');
    console.error('Usage: node version-bump.js <host> <version> <commit>');
    process.exit(1);
  }

  // TODO: git fetch --all
  // TODO: git checkout -B <PRODUCT ID>-release <RELEASE CANDIDATE HASH>

  const releaseNotes = await ReleaseNotes.readFromHostFilepath(host);
  releaseNotes.insertNewVersionHeading(version, new Date());
  const notesForVersion = releaseNotes.notesForVersion(version);
  await releaseNotes.writeToHostFilepath(host);

  // TODO: Update version in host/adblock/build/config/base.mjs OR host/adblockplus/build/webext/config/base.mjs
  // TODO: Pause here, ask the user to review release notes, add summary (open $EDITOR?)
  // TODO: git add affected files
  // TODO: git commit -m 'build: Releasing <PRODUCT NAME> <VERSION> [noissue]'
  // TODO: git push origin <PRODUCT ID>-release -f
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
