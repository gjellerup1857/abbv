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

import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import { commandStorageKey, getStoredCommandIds } from "./command-library";

describe("command-library", () => {
  describe("getStoredCommandIds", () => {
    let prefsObj: Record<string, any>;

    beforeEach(() => {
      const prefsGetMock = jest.spyOn(Prefs, "get");
      prefsGetMock.mockImplementation((key) => prefsObj[key]);
    });

    it("should return an empty array when no commands are stored", () => {
      prefsObj = {
        [commandStorageKey]: {}
      };

      expect(getStoredCommandIds()).toStrictEqual([]);
    });

    it("should return a list of command ids when commands are stored", () => {
      const commandIds = ["command_1", "command_2"];
      prefsObj = {
        [commandStorageKey]: {
          [commandIds[0]]: {
            version: 1,
            ipm_id: commandIds[0],
            command_name: "mock-command"
          },
          [commandIds[1]]: {
            version: 1,
            ipm_id: commandIds[1],
            command_name: "mock-command"
          }
        }
      };

      expect(getStoredCommandIds()).toStrictEqual(commandIds);
    });
  });
});