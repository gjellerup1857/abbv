/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2013-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

import { resolve } from 'path';
import fs from 'fs';
import { Readable } from 'stream';
// eslint-disable-next-line import/no-extraneous-dependencies
import Vinyl from 'vinyl';

let manifest;

async function getJSON(path) {
  let content = await fs.promises.readFile(resolve(path));
  return JSON.parse(content);
}


async function editManifest(dataParam, version, channel, target, extensionId) {
  const data = dataParam;
  data.version = version;

  if (target === 'chrome') {
    delete data.applications;
    delete data.content_security_policy;
  }

  if (target === 'firefox') {
    const gecko = {};
    gecko.strict_min_version = data.applications.gecko.strict_min_version;
    gecko.id = extensionId || data.applications.gecko.id;

    delete data.storage;
    delete data.minimum_chrome_version;
    delete data.minimum_opera_version;
    delete data.optional_permissions;

    data.applications.gecko = gecko;

    if ("action" in data) {
      delete data.action.default_popup;
    }
  }

  if ("declarative_net_request" in data) {
    const rules = await getJSON("./node_modules/@adblockinc/rules/dist/manifest/adblock.json");
    data.declarative_net_request = rules;
  }

  return data;
}

export function createManifest(contents) {
  // eslint-disable-next-line new-cap
  return new Readable.from([
    new Vinyl({
      // eslint-disable-next-line no-undef
      contents: Buffer.from(JSON.stringify(contents, null, 2)),
      path: 'manifest.json',
    }),
  ]);
}

export async function getManifestContent(options) {
  const {target, version, channel, manifestPath, manifestVersion, extensionId } = options;
  if (manifest) {
    return manifest;
  }

  let base;
  if (manifestPath) {
    base = await getJSON(resolve(manifestPath));
  } else {
    base = await getJSON("build/manifest.base.json");
  }
  let specific = await getJSON(`build/manifest.v${manifestVersion}.json`);
  let raw = Object.assign({}, base, specific);

  manifest = await editManifest(raw, version, channel, target, extensionId);

  return manifest;
}
