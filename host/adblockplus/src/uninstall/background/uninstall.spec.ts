/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
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

import { type Experiment } from "@eyeo/webext-ad-filtering-solution";

let mockExperiments: Experiment[] = [];
const mockParams = new Map<string, string>([
  ["locale", "en"],
  ["an", "adblockplus"],
  ["ap", "firefox"],
  ["apv", "100.0"],
  ["av", "1.0"],
  ["c", "0"],
  ["er", "12345678"],
  ["ev", "AA=="],
  ["fv", "0"],
  ["ndc", "0"],
  ["p", "gecko"],
  ["ps", "0"],
  ["pv", "100.0"],
  ["s", "0"],
  ["wafc", "0"]
]);
const mockUrl = "https://www.example.com/uninstall?locale=en";

function getExperiments(assignedVariants: number[]): Experiment[] {
  return [
    {
      id: "a",
      variants: [
        { id: "aa", assigned: !!assignedVariants.includes(1) },
        { id: "ab", assigned: !!assignedVariants.includes(2) },
        { id: "ac", assigned: !!assignedVariants.includes(3) }
      ]
    },
    {
      id: "b",
      variants: [
        { id: "ba", assigned: !!assignedVariants.includes(4) },
        { id: "bb", assigned: !!assignedVariants.includes(5) },
        { id: "bc", assigned: !!assignedVariants.includes(6) }
      ]
    },
    {
      id: "c",
      variants: [
        { id: "ca", assigned: !!assignedVariants.includes(7) },
        { id: "cb", assigned: !!assignedVariants.includes(8) }
      ]
    },
    {
      id: "d",
      variants: [{ id: "da", assigned: !!assignedVariants.includes(9) }]
    },
    {
      id: "e",
      variants: [{ id: "ea", assigned: !!assignedVariants.includes(10) }]
    }
  ];
}

function createExpectedUninstallUrl(overrides: Record<string, string>): string {
  const url = new URL(mockUrl);

  const params = new URLSearchParams();
  for (const [name, defaultValue] of mockParams) {
    params.set(name, overrides[name] ?? defaultValue);
  }
  url.search = params.toString();

  return url.toString();
}

describe("uninstall", () => {
  beforeEach(() => {
    (global as any).browser = {
      runtime: {
        setUninstallURL: jest.fn()
      }
    };
    jest.mock("@eyeo/webext-ad-filtering-solution", () => {
      return {
        experiments: {
          getExperiments: async () => mockExperiments,
          getRevisionId: async () => "12345678"
        },
        filters: {
          getMetadata: async () => null,
          getUserFilters: async () => []
        },
        notifications: {
          getDownloadCount: () => 0
        },
        reporting: {
          getFirstVersion: () => "0"
        },
        subscriptions: {
          ACCEPTABLE_ADS_URL: "",
          getRecommendations: () => [],
          getSubscriptions: async () => []
        }
      };
    });
    jest.mock("../../../adblockpluschrome/lib/prefs.js", () => {
      return {
        Prefs: {
          getDocLink: () => mockUrl
        }
      };
    });
    jest.mock("../../../adblockpluschrome/lib/subscriptionInit.js", () => {
      return {
        isDataCorrupted: () => false
      };
    });
    jest.mock("../../info/background", () => {
      return {
        info: {
          addonName: "adblockplus",
          addonVersion: "1.0",
          application: "firefox",
          applicationVersion: "100.0",
          platform: "gecko",
          platformVersion: "100.0"
        }
      };
    });
    jest.mock("../../premium/background", () => {
      return {
        getPremiumState: () => {
          return { isActive: false };
        }
      };
    });
  });

  it("generates uninstall URL", async () => {
    const { setUninstallURL } = await import("./uninstall");
    await setUninstallURL();

    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      createExpectedUninstallUrl({})
    );
  });

  it("adds experiments variants to uninstall URL", async () => {
    const { setUninstallURL } = await import("./uninstall");

    // Variants: 0x01
    mockExperiments = getExperiments([1]);
    await setUninstallURL();
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      createExpectedUninstallUrl({
        ev: "AQ=="
      })
    );

    // Variants: 0x05
    mockExperiments = getExperiments([1, 3]);
    await setUninstallURL();
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      createExpectedUninstallUrl({
        ev: "BQ=="
      })
    );

    // Variants: 0x0200
    mockExperiments = getExperiments([10]);
    await setUninstallURL();
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      createExpectedUninstallUrl({
        ev: "AgA="
      })
    );

    // Variants: 0x0214
    mockExperiments = getExperiments([3, 5, 10]);
    await setUninstallURL();
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      createExpectedUninstallUrl({
        ev: "AhQ="
      })
    );
  });
});
