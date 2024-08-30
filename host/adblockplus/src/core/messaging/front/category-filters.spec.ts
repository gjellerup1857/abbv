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

import * as filters from "./category-filters";
import * as messaging from "./messaging";
import * as utils from "./utils";

const mockReturnValue = Symbol("return value");

jest.mock("./messaging");
jest.mock("./utils");

describe("Messaging category: filters", () => {
  it("filters.get", async () => {
    (utils.send as jest.Mock).mockImplementation(async () => mockReturnValue);

    const value = await filters.get();

    expect(utils.send).toHaveBeenCalledWith("filters.get");
    expect(value).toStrictEqual(mockReturnValue);
  });

  it("filters.listen", () => {
    const filter = ["foo"];
    filters.listen(filter);

    expect(messaging.listen).toHaveBeenCalledWith({
      type: "filters",
      filter
    });
  });
});
