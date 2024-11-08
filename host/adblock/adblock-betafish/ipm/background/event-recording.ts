/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2013-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

import { CommandName, CommandVersion } from "./command-library.types";
import { storeEvent } from "./data-collection";

/**
 * Records a user event that is connected to a certain command.
 *
 * @param ipmId - The IPM ID
 * @param command - The name of the command the event belongs to
 * @param name - The name of the event to record
 */
export function recordEvent(ipmId: string | null, command: CommandName, name: string): void {
  void storeEvent(ipmId || "no ipm value", command, CommandVersion[command], name);
}

/**
 * Records an event that is not connected to a certain command.
 *
 * @param name The name of the event to record
 */
export function recordGenericEvent(name: string): void {
  void storeEvent("__no_ipm__", "__no_command__", 0, name);
}
