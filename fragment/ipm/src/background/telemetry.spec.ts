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

import {
  type Licensing,
  type Preferences,
  type UserAndHostInformation,
} from "./context.types";
import { sendPing } from "./telemetry";
import { prefs } from "./context";

jest.mock(
  "./context",
  (): {
    info: UserAndHostInformation;
    licensing: Licensing;
    prefs: Preferences;
  } => {
    const prefsData: Record<string, any> = {
      ipm_commands: {},
      ipm_server_url: "https://example.com",
      data_collection_opt_out: false,
      premium_license: {
        lv: 1,
        status: "expired",
        encodedData: "foo",
        signature: "bar",
      },
    };
    return {
      info: {
        async getId() {
          return "123";
        },
        getAppName() {
          return "adblockplus";
        },
        getBrowserName() {
          return "firefox";
        },
        getAppVersion() {
          return "2.6.7";
        },
      },
      licensing: {
        isLicenseValid() {
          return false;
        },
      },
      prefs: {
        get(key) {
          return prefsData[key];
        },
        async set(key, value) {
          prefsData[key] = value;
        },
        on(_key, _callback) {},
        untilLoaded: Promise.resolve(),
      },
    };
  },
);

describe("telemetry", () => {
  beforeEach(async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(async () => {
        return await Promise.resolve({
          ok: true,
          text: async () => "",
          json: async () => ({}),
        });
      }) as jest.Mock,
    );
  });

  describe("sendPing", () => {
    it("fetches IPM data when Prefs.data_collection_opt_out is false", async () => {
      await prefs.set("data_collection_opt_out", false);
      await sendPing();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com",
        expect.anything(),
      );
    });

    it("does not fetch IPM data when Prefs.data_collection_opt_out is true", async () => {
      await prefs.set("data_collection_opt_out", true);
      await sendPing();
      expect(global.fetch).toHaveBeenCalledTimes(0);
    });
  });
});
