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

import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { ReleaseNotes } from "./release-notes.js";
import { updateVersionInConfig } from "./version-bump.js";
import { executeGitCommand } from "./utils.js";

async function run() {
  const host = process.argv[2];
  const version = process.argv[3];
  const commit = process.argv[4];
  const dryRun = process.argv.includes('--dry-run');

  if (!host || !version || !commit) {
    console.error('Please provide a host, version, and commit to release');
    console.error('Usage: node do-release.js <host> <version> <commit> [--dry-run]');
    process.exit(1);
  }

  if (host !== "adblock" && host !== "adblockplus") {
    console.error('Please provide a valid host: adblock or adblockplus');
    process.exit(1);
  }

  // TODO: Validation that version follows semver? 
  // TODO: Validation that version doesn't already exist for that host?

  console.log('- Fetching latest changes');
  await executeGitCommand('git fetch --all');

  const branchName = `${host}-release`;
  console.log(`- Creating release branch: ${branchName}`);
  // TODO: The dry run idea. This is a bit of a pain. 
  // await executeGitCommand(`git checkout -B ${branchName} ${commit }`);
  
  console.log('- Getting unreleased release notes');
  const releaseNotes = await ReleaseNotes.readFromHostFilepath(host);

  console.log('\nUnreleased changes:\n');
  console.log('\n---------------------------------\n');  
  console.log(releaseNotes.unreleasedNotes());
  console.log('\n---------------------------------\n');

  let rl = readline.createInterface({ input: stdin, output: stdout });
  let answer = await rl.question("Is this the version you want to release? (yes / no) ");
  rl.close();

  let userIsSure = answer.toLowerCase().startsWith("y");
  if (!userIsSure) {
    console.log('Okay. Weird. Exiting');
    process.exit(1);
  }

  const releaseNotesPath = ReleaseNotes.hostFilePath(host);
  console.log(`- Updating release notes file: ${releaseNotesPath}`);
  releaseNotes.insertNewVersionHeading(version, new Date());
  await releaseNotes.writeToHostFilepath(host);    
  
  const configPath = host === 'adblock'
    ? 'host/adblock/build/config/base.mjs'
    : 'host/adblockplus/build/webext/config/base.mjs';
  console.log(`- Updating ${configPath} to version ${version}`);  
  updateVersionInConfig(configPath, version);  

  console.log('- Adding changes to git');  
  // await executeGitCommand(`git add ${configPath} ${releaseNotesPath}`);

  console.log('- Committing changes');
  // TODO: Stopped here for now. 
  // await executeGitCommand(`git commit -m 'build: Releasing ${host} ${version} [noissue]'`);

  // TODO: Should we add another prompt here to ask if we should push to origin?
  //       Maybe with a quick git diff?
  // TODO: git push origin <PRODUCT ID>-release -f    
}


// TODO: This file is a bit of a mess right now. 
//       Let's see where else we can group things.
// Try this out by running 
//    npm run do-release -- adblock 11.11.0 3391e6e94
// from the root of this repo.

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
