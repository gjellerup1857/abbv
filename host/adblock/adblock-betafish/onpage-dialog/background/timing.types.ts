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
 * Key for on-page dialog timing configurations storage
 */
export const configsStorageKey = "onpage_dialog_timing_configurations";

/**
 * On-page UI timing configuration
 */
export interface TimingConfiguration {
  /**
   * Number of hours after which on-page dialog can be shown again
   */
  cooldownDuration: number;
  /**
   * Maximum number of minutes after the page was allowlisted that the on-page
   * dialog can be shown for the first time
   */
  maxAllowlistingDelay?: number;
  /**
   * Maximum number of times the on-page dialog can be shown
   */
  maxDisplayCount: number;
  /**
   * Minimum number of minutes after the page was allowlisted that the on-page
   * dialog can be shown for the first time
   */
  minAllowlistingDelay?: number;
}
