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

/**
 * Temporary type for shortened EventEmitter callback,
 * as passed to us by installHandler()
 *
 * @param arg - Argument to pass along to event listeners
 */
export type EventEmitterCallback<T> = (arg: T) => void;

/**
 * Temporary interface for metadata object that we attach to custom filters
 */
export interface FilterMetadata {
  /**
   * Filter creation date
   */
  created: number;
  /**
   * Filter origin
   */
  origin: string;
}

/**
 * Message sender
 */
export interface MessageSender {
  /**
   * Sender frame ID
   */
  frameId: browser.Runtime.MessageSender["frameId"];
  /**
   * Sender tab information
   */
  tab: browser.Runtime.MessageSender["tab"];
}

/**
 * Temporary interface for "tab-removed" event data from TabSessionStorage
 */
export interface TabRemovedEventData {
  /**
   * Tab ID of removed tab
   */
  tabId: number;
  /**
   * Stored session data for removed tab
   */
  value: any;
}
