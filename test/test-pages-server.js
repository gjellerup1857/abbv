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

/* eslint-env node */
/* eslint-disable no-console */

import path from "path";
import url from "url";
import express from "express";

export const testPagesPort = 3005;

let app = express();
let dirname = path.dirname(url.fileURLToPath(import.meta.url));

app.use(express.static(path.join(dirname, "host-pages")));

app.post("/ping-handler", (req, res) => res.sendStatus(200));

export function startTestPagesServer(host) {
  app.listen(testPagesPort, () => {
    console.log(`Test pages server listening at http://${host}:${testPagesPort}`);
  });
}

