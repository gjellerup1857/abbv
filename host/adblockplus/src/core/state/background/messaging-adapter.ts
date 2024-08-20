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

import { port } from "../../api/background";
import { isMessage, type Message } from "../../api/shared";
import { type StateMessage, type Store } from "../shared";

/**
 * Checks whether the given candidate satisfies the requirements to be a
 * StateMessage.
 *
 * @param candidate The candidate to check
 * @returns Whether the given candidate satisfies the requirements to be a
 *  StateMessage
 */
export function isStateMessage(candidate: unknown): candidate is StateMessage {
  return isMessage(candidate) && typeof (candidate as any).key === "string";
}

/**
 * Looks up and returns the current value of the given state property. Will
 * return `undefined` if the message is unsuitable, or if no state property
 * exists for the given key.
 *
 * @param message The message to handle
 * @param store The store to look up the value from
 * @returns The current value for the given state property
 */
export function handleGetStateMessage(message: Message, store: Store): any {
  if (!isStateMessage(message)) {
    return;
  }

  return store[message.key]?.value;
}

/**
 * Updates the value of the state property for the given key. Will return
 * `false` if the message is unsuitable, or if no state property exists for
 * the given key.
 *
 * @param message The message to handle
 * @param store The store to update the value for
 * @returns `true` if the attempt to update was successful, `false` if not
 */
export function handleSetStateMessage(message: Message, store: Store): boolean {
  if (!isStateMessage(message)) {
    return false;
  }

  if (!(message.key in store)) {
    return false;
  }

  if (!("value" in message)) {
    return false;
  }

  store[message.key].next(message.value);
  return true;
}

/**
 * Adds listeners for messages that request to set or get a state property.
 *
 * @param store The store to operate on
 */
export function addMessageListeners(store: Store): void {
  port.on("prefs.get", (message) => handleGetStateMessage(message, store));
  port.on("prefs.set", (message) => handleSetStateMessage(message, store));
}
