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

/**
 * The name for the ping schedule.
 */
export const scheduleName = "ipm_ping_schedule";
/**
 * The name for the Prefs storage key of the interval duration.
 */
export const intervalKey = "ipm_ping_interval";
/**
 * The name for the Prefs storage key of the IPM server URL.
 */
export const serverUrlKey = "ipm_server_url";
/**
 * Contextual functions needed by telemetry to start.
 * This is a temporary solution to dependency injection.
 */
export interface EventEmitter {
  setListener: (scheduleName: string, f: () => void) => Promise<void>,
  setRepeatedSchedule: (scheduleName: string, interval: number) => Promise<void>,
  hasSchedule: (scheduleName: string) => boolean
}
