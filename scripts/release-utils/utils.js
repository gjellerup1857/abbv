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

import fs from "fs";
import url from "url";
import path from "path";

export async function readFile(filePath) {
  let contents = await fs.promises.readFile(filePath, {encoding: "utf-8"});
  return contents.trim();
}

export function projectRootPath() {
  const scriptDir = path.dirname(url.fileURLToPath(import.meta.url));  
  const projectRoot = path.join(scriptDir, "..", "..");  
  return path.normalize(projectRoot);
}