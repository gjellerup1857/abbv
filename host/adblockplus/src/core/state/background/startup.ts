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

import { BehaviorSubject, lastValueFrom } from "rxjs";
import { type Store } from "../shared";
import { addMessageListeners } from "./messaging-adapter";
import {
  hydrateFromManagedStorage,
  hydrateFromStorage,
  listenForStateChanges
} from "./storage-adapter";

const readyStream = new BehaviorSubject(false);

/**
 * A promise that resolves to true once the state core utility is ready to
 * work with.
 */
export const ready = lastValueFrom(readyStream);

/**
 * Starts the state core utility. Will resolve once it is finished attaching
 * listeners and hydrating the store and is ready to work with.
 *
 * @param store The store that holds the state
 */
export async function start(store: Store): Promise<void> {
  // Get defaults for managed installations
  await hydrateFromManagedStorage(store);
  // Load latest state from disk
  await hydrateFromStorage(store);
  // Start listeners to write changes to disk
  listenForStateChanges(store);
  // Setup get/set message listeners
  addMessageListeners(store);
  // Signal state readiness
  readyStream.next(true);
  readyStream.complete();
}
