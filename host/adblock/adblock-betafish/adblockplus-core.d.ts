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
 * Adblock Plus Core libraries
 */
declare module "adblockpluscore/lib/url" {
  /**
   * Parses the domains part of a filter text
   *
   * @param source - The domains part.
   * @param separator - The string used to separate two or more domains in
   *                    the domains part
   */
  const parseDomains: (source: string, separator: string) => Map<string, boolean> | null;

  /**
   * Yields all suffixes for a domain.
   *
   * @param source - The domains part.
   * @param separator - The string used to separate two or more domains in
   *                    the domains part
   */
  const domainSuffixes: (domain: string, includeBlank?: boolean) => string;

  /**
   * Checks whether a given hostname is valid.
   *
   * This function is used for filter validation.
   *
   * A hostname occurring in a filter must be normalized. For example,
   * <code>&#x1f642;</code> (slightly smiling face) should be normalized to
   * `xn--938h`; otherwise this function returns `false` for such a hostname.
   * Similarly, IP addresses should be normalized.
   *
   * @param {string} hostname The hostname to check.
   *
   * @returns {boolean} Whether the hostname is valid.
   */
  const isValidHostname: (hostname: string) => boolean;
}
