/**
 * This file is part of eyeo's Public API fragment,
 * Copyright (C) 2024-present eyeo GmbH

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { MS_IN_DAY } from "./constants.js";

/**
 * Checks if the allowlisting options are valid
 * If expiresAt is option is present, then it's value needs to be between 1 and 365 days.
 *
 * @param allowlistingOptions The allowlisting options
 */
export function hasValidAllowlistingOptions(allowlistingOptions) {
  if (!allowlistingOptions) {
    return true;
  }

  const { expiresAt } = allowlistingOptions;
  if (
    Object.keys(allowlistingOptions).length !== 1 ||
    !Number.isInteger(expiresAt)
  ) {
    return false;
  }

  const now = Date.now();
  const minExpiresAt = now + MS_IN_DAY;
  const maxExpiresAt = now + 365 * MS_IN_DAY;

  return expiresAt >= minExpiresAt && expiresAt <= maxExpiresAt;
}

/**
 * Checks if the allowlisting command has the right format.
 *
 * @param {object} allowlistingCommand The allowlisting command
 * @returns {boolean} True if the command is valid, false otherwise.
 */
export function isValidAllowlistingCommand(allowlistingCommand) {
  if (typeof allowlistingCommand !== "object" || !allowlistingCommand) {
    return false;
  }

  const allowedKeys = ["options", "timeout"];
  const commandKeys = Object.keys(allowlistingCommand);
  if (!commandKeys.every((key) => allowedKeys.includes(key))) {
    return false;
  }

  const { options, timeout } = allowlistingCommand;

  // Ensure timeout is a positive integer
  if (!Number.isInteger(timeout) || timeout <= 0) {
    return false;
  }

  return hasValidAllowlistingOptions(options);
}
