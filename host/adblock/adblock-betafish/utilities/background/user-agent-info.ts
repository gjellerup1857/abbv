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

import { UserAgentInfo, FlavorType } from "./user-agent-info.types";

let info: UserAgentInfo;

function parseUserAgent(): UserAgentInfo {
  let flavor = FlavorType.chrome; // default to Chrome
  // RegEx to obtain the OS and OS Version
  let match = navigator.userAgent.match(/(CrOS \w+|Windows NT|Mac OS X|Linux) ([\d._]+)?/);
  const os = (match || [])[1] || "Unknown";
  const osVersion = (match || [])[2] || "Unknown";
  // RegEx for the Chrome browser version
  match = navigator.userAgent.match(/(?:Chrome|Version)\/([\d.]+)/);
  // RegEx for the Edge browser
  const edgeMatch = navigator.userAgent.match(/(?:Edg|Version)\/([\d.]+)/);
  // RegEx for the Firefox browser
  const firefoxMatch = navigator.userAgent.match(/(?:Firefox)\/([\d.]+)/);
  if (edgeMatch) {
    match = edgeMatch;
    flavor = FlavorType.edge;
  } else if (firefoxMatch) {
    match = firefoxMatch;
    flavor = FlavorType.firefox;
  }
  const browserVersion = (match || [])[1] || "Unknown";

  return {
    flavor,
    os,
    osVersion,
    browserVersion,
  };
}

export function getUserAgentInfo(): UserAgentInfo {
  if (!info) {
    info = parseUserAgent();
  }
  return info;
}
