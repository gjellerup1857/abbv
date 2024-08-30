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

import { type TabDescriptor } from "../../pages/background";
import { type GetBlockedPerPageOptions } from "./category-stats.types";
import * as messaging from "./messaging";
import { send } from "./utils";

/**
 * Retrieves amount of blocked requests for given tab
 *
 * @param tab
 * @returns amount of blocked requests for given tab
 */
export async function getBlockedPerPage(tab: TabDescriptor): Promise<number> {
  const options: GetBlockedPerPageOptions = { tab };
  return await send("stats.getBlockedPerPage", options);
}

/**
 * Retrieves total amount of blocked requests
 *
 * @returns total amount of blocked requests
 */
export async function getBlockedTotal(): Promise<number> {
  return await send("stats.getBlockedTotal");
}

/**
 * Listen to stats-related events
 *
 * @param filter - Event names
 */
export function listen(filter: string[]): void {
  messaging.listen({ type: "stats", filter });
}
