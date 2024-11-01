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
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { ReleaseNotes } from "./release-notes.js";
import { updateVersionInConfig } from "./version-bump.js";
import { executeGitCommand } from "./utils.js";

async function run() {
  const args = yargs(hideBin(process.argv))
      .version(false)
      .strict()
      .command("$0 <host> <version> <commit>", "", subparser =>
        subparser.positional("host", {choices: ["adblock", "adblockplus"]})
          .positional("version", {type: "string"})
          .positional("commit", {type: "string"}))
      .option("dry-run", {
        type: "boolean",
        description: "Make branches and tags with a 'test' prefix, in order to not affect real releases"
      })
      .option("verbose", {
        alias: "v",
        type: "boolean",
        description: "Run with verbose logging"
      })
      .check(argv => {
        if (!argv.version.match(/^\d+(\.\d+){2,}$/)) {
          throw new Error("Invalid version: Version must be a semver version.");
        }
        return true;
      })
      .parse();

  // TODO: Validation that version doesn't already exist for that host?

  console.log('- Fetching latest changes');
  await executeGitCommand('git fetch --all');

  const branchName = `${args.host}-release`;
  console.log(`- Creating release branch: ${branchName}`);
  // TODO: The dry run idea. This is a bit of a pain.
  // await executeGitCommand(`git checkout -B ${branchName} ${args.commit }`);

  console.log('- Getting unreleased release notes');
  const releaseNotes = await ReleaseNotes.readFromHostFilepath(args.host);

  console.log('\nUnreleased changes:\n');
  console.log('\n---------------------------------\n');
  console.log(releaseNotes.unreleasedNotes());
  console.log('\n---------------------------------\n');

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question("Is this the version you want to release? (yes / no) ");
  rl.close();

  const userIsSure = answer.toLowerCase().startsWith("y");
  if (!userIsSure) {
    // If the notes are not in a good place, would the person doing the release
    // have to manually edit them, commit a new version, and then run this
    // script again? Here is where we might want to open up a text editor

    // Maybe here we can do some sort of:
    //    const userWantsToEditReleaseNotes = answer.toLowerCase().startsWith("e"); // For edit?

    // If so, open the current text editor with the release notes file?
    // const editor = process.env.EDITOR || 'vscode';
    // await promisify(exec)(`${editor} ${releaseNotesPath}`);

    console.log('Okay. Weird. Exiting');
    process.exit(1);
  }

  const releaseNotesPath = ReleaseNotes.hostFilePath(args.host);
  console.log(`- Updating release notes file: ${releaseNotesPath}`);
  releaseNotes.insertNewVersionHeading(args.version, new Date());
  await releaseNotes.writeToHostFilepath(args.host);

  console.log(`- Updating ${args.host}'s version to ${args.version}`);
  await updateVersionInConfig(args.host, args.version);

  console.log('- Committing changes');
  // TODO: Stopped here for now.
  // await executeGitCommand(`git commit --all -m 'build: Releasing ${args.host} ${args.version} [noissue]'`);

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
