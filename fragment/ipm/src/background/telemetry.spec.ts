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

import { sendPing } from "./telemetry";
import { context } from "./context";

describe("telemetry", () => {
  beforeEach(() => {
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(async () => {
        return await Promise.resolve({
          ok: true,
          text: async () => "",
          json: async () => ({})
        });
      }) as jest.Mock
    );

    // Prepare the context
    context.getAppName = () => { return "adblockplus"; };
    context.getBrowserName = () => { return "firefox"; };
    context.getAppVersion = () => { return "2.6.7"; };

    context.setPreference("ipm_commands", {});
    context.setPreference("ipm_server_url", "https://example.com");
    context.setPreference("data_collection_opt_out", false);
    context.setPreference("premium_license", {
      lv: 1,
      status: "expired",
      encodedData: "foo",
      signature: "bar"
    });
  });

  describe("sendPing", () => {
    it("fetches IPM data when Prefs.data_collection_opt_out is false", async () => {
      await context.setPreference("data_collection_opt_out", false);
      await sendPing();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com",
        expect.anything()
      );
    });

    it("does not fetch IPM data when Prefs.data_collection_opt_out is true", async () => {
      await context.setPreference("data_collection_opt_out", true);
      await sendPing();
      expect(global.fetch).toHaveBeenCalledTimes(0);
    });
  });
});
