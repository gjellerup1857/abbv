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
 * Basic extension information
 */
export interface ExtensionInfo {
  /**
   * Application currently running the extension.
   */
  application: string;

  /**
   * Extension manifest version.
   */
  manifestVersion: number;

  /**
   * Platform of the appplication currently running the extension.
   */
  platform: Platform;

  /**
   * Browser engine of the appplication currently running the extension.
   */
  store: Store;
}

/**
 * Options for "app.get" message
 */
export interface GetOptions {
  /**
   * Specifies what to retrieve
   */
  what: string;
}

/**
 * Query parameters to be added in a CTA link
 */
export interface CtalinkQueryParams {
  source?: string;
}

/**
 * Options for retrieving a CTA link
 */
export interface GetCtalinkOptions {
  /**
   * CTA link name
   */
  link: string;
  /**
   * Extra query parameters that should be added to the CTA link
   */
  queryParams?: CtalinkQueryParams;
  /**
   * Specifies to retrieve a CTA link
   */
  what: "ctalink";
}

/**
 * Options for retrieving a documentation link
 */
export interface GetDoclinkOptions {
  /**
   * Link ID
   */
  link: string;
  /**
   * Specifies to retrieve a documentation link
   */
  what: "doclink";
}

/**
 * Types of information that can be requested via "app.get" message
 */
export type InfoType =
  | "acceptableAdsUrl"
  | "acceptableAdsPrivacyUrl"
  | "addonName"
  | "addonVersion"
  | "application"
  | "applicationVersion"
  | "ctalink"
  | "doclink"
  | "features"
  | "localeInfo"
  | "os"
  | "platform"
  | "platformVersion"
  | "recommendations"
  | "senderId";

/**
 * Options for "app.open" message
 */
export interface OpenOptions {
  /**
   * Whether the page to open should replace the current tab
   */
  replaceTab?: boolean;
  /**
   * Page to open
   */
  what?: PageName;
}

/**
 * Names of pages that can be opened via "app.open" message
 */
export type PageName = "options" | "premium-onboarding";

/**
 * A single platform name from the options available.
 */
export type Platform = "chromium" | "edgehtml" | "gecko";

/**
 * A single store name from the options available.
 */
export type Store = "chrome" | "edge" | "firefox" | "opera";
