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

import * as notifications from "./category-notifications";
import * as utils from "./utils";

const mockReturnValue = Symbol("return value");

jest.mock("./utils");

describe("Messaging category: notifications", () => {
  it("notifications.get", async () => {
    (utils.send as jest.Mock).mockImplementation(async () => mockReturnValue);

    const displayMethod = "icon";
    const value = await notifications.get(displayMethod);

    expect(utils.send).toHaveBeenCalledWith("notifications.get", {
      displayMethod
    });
    expect(value).toStrictEqual(mockReturnValue);
  });

  it("notifications.seen", async () => {
    await notifications.seen();

    expect(utils.send).toHaveBeenCalledWith("notifications.seen");
  });
});
