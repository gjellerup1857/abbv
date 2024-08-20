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

import * as storage from "./storage";
import {
  hydrateFromManagedStorage,
  hydrateFromStorage,
  listenForStateChanges
} from "./storage-adapter";
import { BehaviorSubject } from "rxjs";

describe("state:storageAdapter", () => {
  describe("hydrateFromStorage", () => {
    it("should populate the store with the data from storage", async () => {
      const store = {
        foo: new BehaviorSubject("__some_value__")
      };
      const valueFromDisk = "__from_disk__";

      jest.spyOn(storage, "getStateFromStorage").mockResolvedValue({
        foo: valueFromDisk
      });

      await hydrateFromStorage(store);

      expect(store.foo.value).toBe(valueFromDisk);
    });
  });

  describe("hydrateFromManagedStorage", () => {
    it("should populate the store with the data from managed storage", async () => {
      const store = {
        foo: new BehaviorSubject("__some_value__")
      };
      const defaultValue = "__from_managed__";

      jest.spyOn(storage, "getDefaultsFromStorage").mockResolvedValue({
        foo: defaultValue
      });

      await hydrateFromManagedStorage(store);

      expect(store.foo.value).toBe(defaultValue);
    });
  });

  describe("listenForStateChanges", () => {
    it("should call for storage update when a value changes ", async () => {
      const store = {
        foo: new BehaviorSubject("__some_value__")
      };

      jest.spyOn(storage, "persistSingleProperty");

      listenForStateChanges(store);

      const newValue = "__new_value__";
      store.foo.next(newValue);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(storage.persistSingleProperty).toHaveBeenCalledWith(
        "foo",
        newValue
      );
    });
  });
});
