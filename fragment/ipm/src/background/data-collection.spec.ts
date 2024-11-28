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

import * as commandLibraryTypes from "./command-library.types";
import { getSupportedCommandsData } from "./data-collection";

jest.mock("./command-library.types");

// We need to type cast the module into an object with writeable properties,
// so we can use different values for different tests.
const mockCommandLibraryTypes = commandLibraryTypes as {
  CommandName: Record<string, string>;
  CommandVersion: Record<string, number>;
};

describe("data-collection", () => {
  describe("getSupportedCommandsData", () => {
    it("should return an empty list when the extension doesn't support any IPM command", () => {
      mockCommandLibraryTypes.CommandName = {};
      mockCommandLibraryTypes.CommandVersion = {};

      expect(getSupportedCommandsData()).toStrictEqual([]);
    });

    it("should return a list of commands data objects when the extension supports IPM commands", () => {
      mockCommandLibraryTypes.CommandName = {
        commandTypeA: "command_type_A",
        commandTypeB: "command_type_B",
      };
      mockCommandLibraryTypes.CommandVersion = {
        command_type_A: 1,
        command_type_B: 2,
      };

      expect(getSupportedCommandsData()).toStrictEqual([
        { name: "command_type_A", version: 1 },
        { name: "command_type_B", version: 2 },
      ]);
    });
  });
});
