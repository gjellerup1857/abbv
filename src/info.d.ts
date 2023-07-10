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
 * Module generated when building the extension, which provides information
 * about the extension
 */
declare module "info" {
  /**
   * The base name of the extension. Always "adblockplus".
   */
  export const baseName = "adblockplus";
  /**
   * The name of the extension build.
   * e.g. "adblockpluschrome", "adblockplusfirefox"
   */
  export const addonName: string;
  /**
   * Extension version
   */
  export const addonVersion: string;
  /**
   * Browser name
   * e.g. "chrome", "edge", "firefox", "opera", "unknown"
   */
  export const application: string;
  /**
   * Browser version
   */
  export const applicationVersion: string;
  /**
   * Browser platform name
   * e.g. "chromium", "gecko"
   */
  export const platform: string;
  /**
   * Browser platform version
   */
  export const platformVersion: string;
}