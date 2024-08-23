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

import browser from "webextension-polyfill";
import {
  getDefaultsFromStorage,
  getStateFromStorage,
  persistSingleProperty,
  prefix
} from "./storage";

describe("state:storage", () => {
  describe("persistSingleProperty", () => {
    it("should call the browser API with the correct value and prefixed key", async () => {
      const key = "__key__";
      const value = "__value__";
      const spy = jest.spyOn(browser.storage.local, "set").mockResolvedValue();

      void persistSingleProperty(key, value);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith({
        [prefix + key]: value
      });
    });
  });

  describe("getStateFromStorage", () => {
    it("should call the browser API with the correct prefixed keys", async () => {
      const key1 = "__key1__";
      const key2 = "__key2__";
      const spy = jest
        .spyOn(browser.storage.local, "get")
        .mockResolvedValue({});

      void getStateFromStorage([key1, key2]);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith([prefix + key1, prefix + key2]);
    });

    it("should remove prefixes from keys of obtained data", async () => {
      const key1 = "__key1__";
      const key2 = "__key2__";
      const value = "__value__";
      jest.spyOn(browser.storage.local, "get").mockResolvedValue({
        [prefix + key1]: value,
        [prefix + key2]: value
      });

      const result = await getStateFromStorage([key1, key2]);

      expect(result).toContainAllKeys([key1, key2]);
    });

    it("should pass through values", async () => {
      const key1 = "__key1__";
      const key2 = "__key2__";
      const value1 = "__value1__";
      const value2 = "__value2__";
      jest.spyOn(browser.storage.local, "get").mockResolvedValue({
        [prefix + key1]: value1,
        [prefix + key2]: value2
      });

      const result = await getStateFromStorage([key1, key2]);

      expect(result).toEqual({
        [key1]: value1,
        [key2]: value2
      });
    });
  });

  describe("getDefaultsFromStorage", () => {
    it("should call the browser API with the correct parameter", async () => {
      const spy = jest
        .spyOn(browser.storage.managed, "get")
        .mockResolvedValue({});

      void getDefaultsFromStorage();

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(null);
    });

    it("should return whatever it gets from the browser API", async () => {
      const data = {
        key: "value",
        otherKey: "otherValue"
      };
      jest.spyOn(browser.storage.managed, "get").mockResolvedValue(data);

      const result = await getDefaultsFromStorage();

      expect(result).toEqual(data);
    });
  });
});
