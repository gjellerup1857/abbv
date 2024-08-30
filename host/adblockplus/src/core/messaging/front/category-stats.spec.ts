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

import * as stats from "./category-stats";
import * as messaging from "./messaging";
import * as utils from "./utils";

const mockReturnValue = Symbol("return value");

jest.mock("./messaging");
jest.mock("./utils");

describe("Messaging category: stats", () => {
  it("stats.getBlockedPerPage", async () => {
    (utils.send as jest.Mock).mockImplementation(async () => mockReturnValue);

    const tab = { id: 12 };
    const value = await stats.getBlockedPerPage(tab);

    expect(utils.send).toHaveBeenCalledWith("stats.getBlockedPerPage", {
      tab
    });
    expect(value).toStrictEqual(mockReturnValue);
  });

  it("stats.getBlockedTotal", async () => {
    (utils.send as jest.Mock).mockImplementation(async () => mockReturnValue);

    const value = await stats.getBlockedTotal();

    expect(utils.send).toHaveBeenCalledWith("stats.getBlockedTotal");
    expect(value).toStrictEqual(mockReturnValue);
  });

  it("stats.listen", () => {
    const filter = ["foo"];
    stats.listen(filter);

    expect(messaging.listen).toHaveBeenCalledWith({
      type: "stats",
      filter
    });
  });
});
