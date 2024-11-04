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
import { executeShellCommand } from "./utils.js";

async function run() {
  const args = yargs(hideBin(process.argv))
      .version(false)
      .strict()
      .command("$0 <host> <version> <commit>", "", subparser =>
        subparser.positional("host", {choices: ["adblock", "adblockplus"]})
          .positional("version", {type: "string"})
          .positional("commit", {type: "string"}))
      .option("release-date", {
        type: "string",
        description: "Sets the date of the release. Defaults to today.",
        coerce: arg => new Date(arg)
      })
      .option("yes", {
        type: "boolean",
        description: "Answers yes to all prompts."
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

        if (argv.releaseDate && isNaN(argv.releaseDate)) {
          throw new Error("Invalid release date: This must be a valid date string.");
        }

        return true;
      })
      .parse();

  // TODO: Validation that version doesn't already exist for that host?

  console.log('- Fetching latest changes');
  await executeShellCommand('git fetch --all');

  const branchName = `${args.host}-release`;
  console.log(`- Creating release branch: ${branchName}`);    
  await executeShellCommand(`git checkout -B ${branchName} ${args.commit }`);

  const releaseNotesPath = ReleaseNotes.hostFilePath(args.host);
  let releaseNotes = await ReleaseNotes.readFromHostFilepath(args.host);
  
  let answer;    
  
  if (!args.yes) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    while(!answer || answer.toLowerCase().startsWith("r")) {
      console.log('- Getting unreleased release notes');
      
      releaseNotes = await ReleaseNotes.readFromHostFilepath(args.host);
     
      console.log('\nUnreleased changes:\n');
      console.log('\n---------------------------------\n');
      console.log(releaseNotes.unreleasedNotes());
      console.log('\n---------------------------------\n');

      const question = `Is this the version you want to release? : 
(yes) - Continue with the release.
(no) - Exit the release process.
(reload) - You need to change this file: ${releaseNotesPath} and then reload the release notes file to check again. 
`;

      answer = await rl.question(question);     
    }

    rl.close();
  }

  const userIsSure = args.yes || answer.toLowerCase().startsWith("y");
  if (!userIsSure) {    
    console.log('- Exiting the release process.');
    process.exit(1);
  }

  console.log(`- Updating release notes file: ${releaseNotesPath}`);
  releaseNotes.insertNewVersionHeading(args.version, args.releaseDate || new Date());
  await releaseNotes.writeToHostFilepath(args.host);

  console.log(`- Updating ${args.host}'s version to ${args.version}`);
  await updateVersionInConfig(args.host, args.version);

  console.log('- Committing changes');

  await executeShellCommand(`git commit --all -m 'build: Releasing ${args.host} ${args.version} [noissue]'`);

  // TODO: Should we add another prompt here to ask if we should push to origin?
  //       Maybe with a quick git diff?
  await executeShellCommand(`git push origin ${branchName} -f`);
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
