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

import { type BehaviorSubject } from "rxjs";

/**
 * Due to type restrictions of the storage area we use to persist state data,
 * state values can only be of certain types.
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/set#parameters
 */
export type StateValue =
  | number
  | boolean
  | string
  | any[]
  | Record<string, any>;

/**
 * The format of the Store object that holds the state.
 */
export type Store = Record<string, BehaviorSubject<StateValue>>;

/**
 * The format of the state data when persisted on disk.
 */
export type StateData = Record<string, StateValue>;
