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

import "jest-extended";
import { start, ready } from "./startup";
import * as storageAdapter from "./storage-adapter";
import * as messagingAdapter from "./messaging-adapter";

describe("state:startup", () => {
  beforeEach(() => {
    jest
      .spyOn(storageAdapter, "hydrateFromManagedStorage")
      .mockImplementation();
    jest.spyOn(storageAdapter, "hydrateFromStorage").mockImplementation();
  });

  describe("start", () => {
    it("should call hydration in right order", async () => {
      await start({});

      expect(storageAdapter.hydrateFromManagedStorage).toHaveBeenCalledOnce();
      expect(storageAdapter.hydrateFromStorage).toHaveBeenCalledOnce();

      expect(storageAdapter.hydrateFromManagedStorage).toHaveBeenCalledBefore(
        storageAdapter.hydrateFromStorage as jest.Mock
      );
    });

    it("should initiate state change listening", async () => {
      jest.spyOn(storageAdapter, "listenForStateChanges");

      await start({});

      expect(storageAdapter.listenForStateChanges).toHaveBeenCalledOnce();
    });

    it("should initiate message listening", async () => {
      jest.spyOn(messagingAdapter, "addMessageListeners");

      await start({});

      expect(messagingAdapter.addMessageListeners).toHaveBeenCalledOnce();
    });

    it("should signal ready state", async () => {
      await start({});
      await expect(ready).toResolve();
    });
  });
});
