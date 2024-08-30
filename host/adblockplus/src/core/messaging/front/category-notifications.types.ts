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
 * Available display methods.
 */
export type DisplayMethod = "icon" | "newtab" | "notification" | "popup";

/**
 * Notification retrieval options.
 */
export interface GetOptions {
  /**
   * Desired display method.
   */
  displayMethod: DisplayMethod;
}

/**
 * Localized notification texts
 */
interface LocalizedTexts {
  /**
   * Localized notification message
   */
  message?: string;
  /**
   * Localized notification title
   */
  title?: string;
}

/**
 * Notification
 */
export interface Notification extends Record<string, unknown> {
  /**
   * Notification texts
   */
  texts: LocalizedTexts;
}
