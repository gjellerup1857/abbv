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

import * as ctalinks from "./category-ctalinks";
import * as utils from "./utils";

const mockReturnValue = Symbol("return value");

jest.mock("./messaging");
jest.mock("./utils");

describe("Messaging category: ctalinks", () => {
  it("ctalinks.get without query parameters", async () => {
    (utils.send as jest.Mock).mockImplementation(async () => mockReturnValue);

    const link = "foo";
    const value = await ctalinks.get(link);

    expect(utils.send).toHaveBeenCalledWith("app.get", {
      what: "ctalink",
      link,
      queryParams: {}
    });
    expect(value).toStrictEqual(mockReturnValue);
  });

  it("ctalinks.get with query parameters", async () => {
    (utils.send as jest.Mock).mockImplementation(async () => mockReturnValue);

    const link = "foo";
    const source = "bar";
    const value = await ctalinks.get(link, { source });

    expect(utils.send).toHaveBeenCalledWith("app.get", {
      what: "ctalink",
      link,
      queryParams: { source }
    });
    expect(value).toStrictEqual(mockReturnValue);
  });
});
