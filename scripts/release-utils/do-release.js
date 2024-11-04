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
import { executeShellCommand, gitRepoHasChanges } from "./utils.js";

async function executeMaybe(command, dryRun) {
  if (dryRun) {
    console.log(`Dry run, would have run: ${command}`);
  } else {
    await executeShellCommand(command);
  }
}

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
      .option("skip-git", {
        type: "boolean",
        description: "Don't actually run any git commands. Useful for manual testing the script interface."
      })
      .option("skip-tag", {
        type: "boolean",
        description: "Do not create a tag for the release."
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

  if (!args.skipGit && await gitRepoHasChanges()) {
    console.log("You have uncommitted changes. Commit them or stash them and try again.");
    process.exit(1);
  }

  const tagName = `${args.host}-${args.version}`;

  if (!args.skipGit) {
    const legacyTagName = `${args.host}-v${args.version}`;
    const existingTags = await executeShellCommand(`git tag --list ${tagName} ${legacyTagName}`);
    const versionAlreadyExists = existingTags != "";

    if (versionAlreadyExists) {
      console.log(`${args.host} version ${args.version} already exists.`);
      process.exit(1);
    }
  }


  console.log('- Fetching latest changes');
  await executeMaybe('git fetch --all', args.skipGit);

  const branchName = `${args.host}-release`;
  console.log(`- Creating release branch: ${branchName}`);
  await executeMaybe(`git checkout -B ${branchName} ${args.commit }`, args.skipGit);

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

      // TODO: Use a nice library for this to make the prompting nicer
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

  await executeMaybe(`git commit --all -m 'build: Releasing ${args.host} ${args.version} [noissue]'`, args.skipGit);

  // TODO: Should we add another prompt here to ask if we should push to origin?
  //       Maybe with a quick git diff?

  await executeMaybe(`git push origin ${branchName} -f`, args.skipGit);

  if (!args.skipTag) {
    await executeMaybe(`git tag -a -m '' ${tagName}`, args.skipGit);
    await executeMaybe(`git push origin ${tagName}`, args.skipGit);
  }
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
