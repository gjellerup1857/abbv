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

import browser from "webextension-polyfill";
import { type StateData, type StateValue } from "../shared";

/* ######################### !! ATTENTION !! ############################ */
/* Note that this is a temporary solution. The State Core Utility should  */
/* use the Storage Core Utility for disk I/O once that is available.      */
/* ###################################################################### */

/**
 * The prefix for the keys we want to store.
 */
export const prefix = "state:";

/**
 * Persists a single state property.
 *
 * @param key The state property to persist
 * @param value The value for the property
 */
export async function persistSingleProperty(
  key: string,
  value: StateValue
): Promise<void> {
  await browser.storage.local.set({
    [prefix + key]: value
  });
}

/**
 * Reads persisted state data from storage.
 *
 * @param keys The state properties to get the values for
 * @returns The persisted state data
 */
export async function getStateFromStorage(keys: string[]): Promise<StateData> {
  const prefixedData = await browser.storage.local.get(
    keys.map((key) => prefix + key)
  );

  return Object.fromEntries(
    Object.entries(prefixedData).map(([key, value]) => [
      key.slice(prefix.length),
      value
    ])
  );
}

/**
 * Reads the state defaults from managed storage.
 *
 * @returns The default state data
 */
export async function getDefaultsFromStorage(): Promise<StateData> {
  if (!("managed" in browser.storage)) {
    return {};
  }

  try {
    return await browser.storage.managed.get(null);
  } catch (_) {
    // Opera doesn't support browser.storage.managed, but instead of simply
    // removing the API, it gives an asynchronous error which we ignore here.
    return {};
  }
}
