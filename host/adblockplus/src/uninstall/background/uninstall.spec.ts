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

let mockExperiments: any[] = [];
const mockParams = new Map<string, number|string>([
  ["locale", "en"],
  ["an", "adblockplus"],
  ["ap", "firefox"],
  ["apv", "100.0"],
  ["av", "1.0"],
  ["c", 0],
  ["er", "12345678"],
  ["ev", "AA=="],
  ["fv", 0],
  ["ndc", 0],
  ["p", "gecko"],
  ["ps", "0"],
  ["pv", "100.0"],
  ["s", 0],
  ["wafc", 0]
]);
const mockUrl = "https://www.example.com/uninstall?locale=en";

function getExperiments(assignments: boolean[]) {
  return [
    {
      id: "a",
      variants: [
        { id: "aa", assigned: !!assignments[0] },
        { id: "ab", assigned: !!assignments[1] },
        { id: "ac", assigned: !!assignments[2] }
      ]
    },
    {
      id: "b",
      variants: [
        { id: "ba", assigned: !!assignments[3] },
        { id: "bb", assigned: !!assignments[4] },
        { id: "bc", assigned: !!assignments[5] }
      ]
    },
    {
      id: "c",
      variants: [
        { id: "ca", assigned: !!assignments[6] },
        { id: "cb", assigned: !!assignments[7] }
      ]
    },
    {
      id: "d",
      variants: [
        { id: "da", assigned: !!assignments[8] }
      ]
    },
    {
      id: "e",
      variants: [
        { id: "ea", assigned: !!assignments[9] }
      ]
    }
  ];
}

function getUninstallUrl(overrides: Record<string, any>) {
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
    global.browser = {
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
          return {isActive: false };
        }
      };
    });
  });

  it("generates uninstall URL", async () => {
    const {setUninstallURL} = await import("../../../adblockpluschrome/lib/uninstall.js");
    await setUninstallURL();

    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      getUninstallUrl({})
    );
  });

  it("adds experiments variants to uninstall URL", async () => {
    const {setUninstallURL} = await import("../../../adblockpluschrome/lib/uninstall.js");

    // Variants: 1 (0x01)
    mockExperiments = getExperiments([true]);
    await setUninstallURL();
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      getUninstallUrl({
        ev: "AQ=="
      })
    );

    // Variants: 1, 3 (0x05)
    mockExperiments = getExperiments([true, false, true]);
    await setUninstallURL();
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      getUninstallUrl({
        ev: "BQ=="
      })
    );

    // Variants: 10 (0x0200)
    mockExperiments = getExperiments([
      false, false, false, false, false,
      false, false, false, false, true
    ]);
    await setUninstallURL();
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      getUninstallUrl({
        ev: "AgA="
      })
    );

    // Variants: 3, 5, 10 (0x0214)
    mockExperiments = getExperiments([
      false, false, true, false, true,
      false, false, false, false, true
    ]);
    await setUninstallURL();
    expect(browser.runtime.setUninstallURL).toHaveBeenCalledWith(
      getUninstallUrl({
        ev: "AhQ="
      })
    );
  });
});
