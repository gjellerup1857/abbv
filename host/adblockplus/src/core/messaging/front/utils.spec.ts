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

import * as utils from "./utils";

const mockReturnValue = Symbol("return value");

describe("Messaging utilities", () => {
  beforeEach(() => {
    jest
      .spyOn(browser.runtime, "sendMessage")
      .mockImplementation(async () => mockReturnValue);
  });

  it("sends a message with options", async () => {
    const type = "foo";
    const paramA = 12;
    const paramB = 21;
    const value = await utils.send(type, { paramA, paramB });

    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      type,
      paramA,
      paramB
    });
    expect(value).toStrictEqual(mockReturnValue);
  });

  it("sends a message without options", async () => {
    const type = "foo";
    const value = await utils.send(type);

    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      type
    });
    expect(value).toStrictEqual(mockReturnValue);
  });

  it("passes along errors thrown by browser when sending", async () => {
    const error = new Error("Error when sending message");
    jest.spyOn(browser.runtime, "sendMessage").mockImplementation(async () => {
      throw error;
    });

    await expect(async () => {
      await utils.send("foo");
    }).rejects.toThrow(error);
  });
});
