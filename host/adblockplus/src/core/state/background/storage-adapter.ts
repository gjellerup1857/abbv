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

import { debounceTime, distinctUntilChanged, skip } from "rxjs";
import { type StateData, type Store } from "../shared";
import {
  getDefaultsFromStorage,
  getStateFromStorage,
  persistSingleProperty
} from "./storage";

/**
 * Subscribes to state changes in the given store, and triggers writing the
 * changes to disk.
 *
 * @param store The store to listen to
 */
export function listenForStateChanges(store: Store): void {
  for (const [name, subject] of Object.entries(store)) {
    subject
      .pipe(skip(1), debounceTime(500), distinctUntilChanged())
      .subscribe((value: any) => {
        void persistSingleProperty(name, value);
      });
  }
}

/**
 * Hydrates the given store with data from disk.
 *
 * @param store The store to hydrate
 */
export async function hydrateFromStorage(store: Store): Promise<void> {
  const dataFromStorage = await getStateFromStorage(Object.keys(store));
  hydrate(store, dataFromStorage);
}

/**
 * Hydrates the given store with values from managed storage. This is
 * necessary for managed installations that may have different default values.
 *
 * @param store The store to hydrate
 */
export async function hydrateFromManagedStorage(store: Store): Promise<void> {
  const defaults = await getDefaultsFromStorage();
  hydrate(store, defaults);
}

/**
 * Hydrates the given store with the given data.
 *
 * @param store The store to hydrate
 * @param data The data to hydrate the store with
 */
function hydrate(store: Store, data: StateData): void {
  for (const [name, value] of Object.entries(data)) {
    const subject = store[name];
    subject.next(value);
  }
}
