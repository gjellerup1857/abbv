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

import { CommandName, CommandVersion } from "./command-library.types";
import * as DataCollection from "./data-collection";
import { recordEvent, recordGenericEvent } from "./event-recording";

describe("event-recording", () => {
  describe("recordEvent", () => {
    beforeEach(() => {
      jest.spyOn(DataCollection, "storeEvent").mockImplementation();
    });
    it("should call storeEvent with the correct parameters", async () => {
      const ipmId = "__ipm_id__";
      const command = CommandName.createTab;
      const commandVersion = CommandVersion[command];
      const eventName = "__event_name__";
      recordEvent(ipmId, command, eventName);

      expect(DataCollection.storeEvent).toHaveBeenCalledTimes(1);
      expect(DataCollection.storeEvent).toHaveBeenCalledWith(
        ipmId,
        command,
        commandVersion,
        eventName,
      );
    });
  });
  describe("recordGenericEvent", () => {
    beforeEach(() => {
      jest.spyOn(DataCollection, "storeEvent").mockImplementation();
    });
    it("should call storeEvent with the correct parameters", async () => {
      const eventName = "__event_name__";
      recordGenericEvent(eventName);

      expect(DataCollection.storeEvent).toHaveBeenCalledTimes(1);
      expect(DataCollection.storeEvent).toHaveBeenCalledWith(
        "__no_ipm__",
        "__no_command__",
        0,
        eventName,
      );
    });
  });
});
