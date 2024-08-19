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

import { Prefs } from "../../alias/prefs.js";
import { Stats, statsStorageKey } from "./stats.types";

/**
 * Clears stats for given IPM ID
 *
 * @param ipmId - IPM ID
 */
export function clearStats(ipmId: string): void {
  const statsStorage = Prefs.get(statsStorageKey);
  delete statsStorage[ipmId];
  Prefs.set(statsStorageKey, statsStorage);
}

/**
 * Retrieves stats for given IPM ID
 *
 * @param ipmId - IPM ID
 *
 * @returns stats
 */
export function getStats(ipmId: string): Stats | null {
  const statsStorage = Prefs.get(statsStorageKey);
  return statsStorage[ipmId] || null;
}

/**
 * Checks whether given candidate is stats
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is stats
 */
export function isStats(candidate: unknown): candidate is Stats {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "displayCount" in candidate &&
    "lastDisplayTime" in candidate
  );
}

/**
 * Sets stats for given IPM ID
 *
 * @param ipmId - IPM ID
 * @param stats - Stats
 */
export function setStats(ipmId: string, stats: Stats): void {
  const storage = Prefs.get(statsStorageKey);
  storage[ipmId] = stats;
  Prefs.set(statsStorageKey, storage);
}