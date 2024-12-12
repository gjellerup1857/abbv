/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2024-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import { expect } from "expect";

export const installUrl = "https://welcome.adblockplus.org/en/installed";

export async function checkInstallUninstallUrl(url, appVersion) {
  const { browserName, majorBrowserVersion } = browserDetails;

  const base = {
    av: appVersion,
    pv: majorBrowserVersion.toString(),
    apv: majorBrowserVersion.toString()
  };

  const expectedParams = {
    chromium: {
      ...base,
      an: "adblockpluschrome",
      ap: "chrome",
      p: "chromium"
    },
    edge: {
      ...base,
      an: "adblockpluschrome",
      ap: "edge",
      p: "chromium"
    },
    firefox: {
      ...base,
      an: "adblockplusfirefox",
      ap: "firefox",
      p: "gecko"
    }
  }[browserName];

  if (!expectedParams) {
    throw new Error(`Unexpected browser name: ${browserName}`);
  }

  const params = new URLSearchParams(new URL(url).search);
  const actualParams = Object.fromEntries(params);

  expect(actualParams).toEqual(expectedParams);
}
