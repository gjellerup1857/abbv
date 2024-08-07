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

import { type PingMessage } from "./messages.types";

/**
 * Checks whether given candidate is message of type "onpage-dialog.ping"
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is message of type "onpage-dialog.ping"
 */
export function isPingMessage(candidate: unknown): candidate is PingMessage {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "displayDuration" in candidate &&
    "type" in candidate
  );
}
