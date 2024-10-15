/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */

import expect from "expect";
import fs from "fs";
import os from "os";
import path from "path";

import {merge} from "../../scripts/mergeSubscriptions.js";

describe("mergeSubscriptions script", function() {
  let tmpDir;

  beforeEach(async function() {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "tmp-"));
  });

  afterEach(async function() {
    if (fs.existsSync(tmpDir)) {
      await fs.promises.rm(tmpDir, {recursive: true});
    }
  });

  function randomTmpFile() {
    return path.join(tmpDir, "inFile-" + (Math.random() + 1).toString(36).substring(7) + ".json");
  }

  async function assertSubscriptionsContent(
    space, inContents, expectedOutContent) {
    await assertSubscriptions(space, inContents, actualOutContent => {
      expect(actualOutContent.toString())
        .toEqual(expectedOutContent);
    });
  }

  async function assertSubscriptions(space, inContents, assertCallback) {
    let fromFiles = [];
    for (let inContent of inContents) {
      let fromFile = randomTmpFile();
      fromFiles.push(fromFile);
      await fs.promises.writeFile(fromFile, inContent);
    }
    let toFile = randomTmpFile();
    await merge(fromFiles, toFile, space);
    assertCallback(await fs.promises.readFile(toFile));
  }

  it("should merge empty array files", async function() {
    await assertSubscriptionsContent(null, ["[]", "[]"], "[]");
  });

  it("should process single file", async function() {
    let content = "[{\"title\":\"some_title\"}]";
    await assertSubscriptionsContent(null, [content], content);
  });

  async function assertMultipleSubscriptions(count) {
    let contents = [];
    let fieldName = "title";
    let fieldValue = "value";
    for (let i = 0; i < count; i++) {
      contents.push(`[{"${fieldName}${i}": "${fieldValue}${i}"}]`);
    }

    await assertSubscriptions(null, contents, actualContent => {
      let obj = JSON.parse(actualContent);
      expect(obj.length).toEqual(count);
      for (let i = 0; i < count; i++) {
        expect(obj.find(item => item[fieldName + i] === (fieldValue + i)))
          .not.toEqual(-1);
      }
    });
  }

  it("should merge two files", async function() {
    await assertMultipleSubscriptions(2);
  });

  it("should merge three files", async function() {
    await assertMultipleSubscriptions(3);
  });

  it("should use space", async function() {
    let content = "[{\"a\":\"b\"}]";
    await assertSubscriptionsContent(null, [content], content);
    await assertSubscriptionsContent(2, [content], "[\n  {\n    \"a\": \"b\"\n  }\n]");
    await assertSubscriptionsContent(4, [content], "[\n    {\n        \"a\": \"b\"\n    }\n]");
  });

  it("should throw on missing file", async function() {
    let missingInFile = randomTmpFile();
    let outFile = randomTmpFile();
    expect(fs.existsSync(missingInFile)).toEqual(false);
    await expect(merge([missingInFile], outFile)).rejects.toThrow();
  });
});
