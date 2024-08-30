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

import {
  type DisplayMethod,
  type GetOptions,
  type Notification
} from "./category-notifications.types";
import { send } from "./utils";

/**
 * Retrieves notification that can be displayed in the given manner
 *
 * @param displayMethod - Method with which notification can be displayed
 * @returns notification that can be displayed in the given manner
 */
export async function get(displayMethod: DisplayMethod): Promise<Notification> {
  const options: GetOptions = { displayMethod };
  return await send("notifications.get", options);
}

/**
 * Marks active notification as seen
 */
export async function seen(): Promise<void> {
  await send("notifications.seen");
}
