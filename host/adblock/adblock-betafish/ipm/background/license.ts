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

import { License } from "../../picreplacement/check";
import { LicenseState } from "./data-collection.types";
import { LicenseStateBehavior } from "./command-library.types";

/**
 * Checks whether the given parameter is of type LicenseState.
 *
 * @param candidate The input to check
 * @returns Whether the parameter is a LicenseState
 */
export function isValidLicenseState(candidate: unknown): candidate is LicenseState {
  return (
    typeof candidate === "string" && Object.values(LicenseState).includes(candidate as LicenseState)
  );
}

/**
 * Checks whether the current Premium license state match the license state on the command
 * @param behavior - the behavior of the command
 * @return true - the current Premium license state matches the license state on the command
 */
export const doesLicenseStateMatch = async function (
  behavior: LicenseStateBehavior,
): Promise<boolean> {
  // If the string is empty, then its a match
  if (!behavior.license_state_list) {
    return true;
  }
  const licenseStates = behavior.license_state_list.split(",");
  await License.ready();
  return licenseStates.some(
    (state) =>
      (state === LicenseState.active && License.isActiveLicense()) ||
      (state === LicenseState.inactive && !License.isActiveLicense()),
  );
};

/**
 * The default license state for the license_state_list command parameter.
 */
export const defaultLicenseState = LicenseState.inactive;
