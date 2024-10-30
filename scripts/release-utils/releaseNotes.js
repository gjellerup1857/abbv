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

import path from "path";

import {projectRootPath, readFile} from "./utils.js";

export class ReleaseNotes {
  constructor(fileContent) {
    this.lines = fileContent.split("\n");
  }

  toString() {
    return this.lines.join("\n");
  }

  notesForVersion(version) {
    const start = this.lines.findIndex((currentLine) => {
      const line = currentLine.toLowerCase();
      const headingStart = "# " + version.toLowerCase();
      
      return line.startsWith(headingStart + " ") || line == headingStart;
    });
      
    if (start < 0) {
      throw new Error(`Could not find notes for version ${version}`);
    }

    let end = this.lines.findIndex((line, index) => {
      if (index <= start) {
        return false;
      }

      return line.startsWith("# ");
    });

    if (end < 0) {      
      end = this.lines.length;
    }

    return this.lines.slice(start, end).join("\n").trim();
  }
}

ReleaseNotes.hostFilePath = function(host) {   
  return path.join(projectRootPath(), 'host', host, 'RELEASE_NOTES.md');
};

ReleaseNotes.readFromHostFilepath = async function(host) {
  let releaseNotesContent = await readFile(ReleaseNotes.hostFilePath(host));
  return new ReleaseNotes(releaseNotesContent);
};

